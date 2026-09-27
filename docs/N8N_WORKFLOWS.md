# SmartAttend AI - n8n Automated Notification & Workflow Architecture

SmartAttend AI integrates with **n8n** (an open-source workflow automation tool) to decouple attendance tracking from complex notification delivery (Emails, Telegram alerts, SMS, and admin digests).

---

## 1. High-Level Architecture

```
[Faculty Marks Attendance] 
          │
          ▼
[SmartAttend AI Express Backend] ──(HTTP POST Webhook)──▶ [n8n Webhook Node]
                                                                 │
          ┌──────────────────────────────────────────────────────┴──────────────────────────────────────┐
          │                                                                                             │
          ▼                                                                                             ▼
   [Branch 1: Absent Event]                                                                   [Branch 2: Threshold Check]
          │                                                                                             │
          ├─▶ [Send Email to Student]                                                                   ├─▶ [Filter: Attendance < 75%]
          ├─▶ [Send Email/SMS to Parent]                                                                ├─▶ [Compose Critical Warning Email]
          └─▶ [Optional: Telegram Parent Bot]                                                           └─▶ [Dispatch High-Priority Alert]
```

---

## 2. Integrated Workflows Catalog

### Workflow 1: Low Attendance Alert (Below 75%)
* **Trigger:** Webhook `POST /webhook/attendance-recorded`
* **Condition:** `student.attendance_percentage < 75.0`
* **Actions:**
  1. Calculate remaining classes needed to recover to $\ge 80\%$.
  2. Send email alert to student with study coordinator CC'd.
  3. Send formal notification email to registered parent/guardian.
  4. Post log entry back to SmartAttend `POST /api/notifications`.

### Workflow 2: Student Absent Notification (Daily)
* **Trigger:** Attendance batch submission where `status === 'Absent'`
* **Actions:**
  - Send instant push / email alert:
    > "Dear {{ student_name }}, you were marked Absent for {{ subject_name }} on {{ date }} ({{ time_slot }}). If this is an error, please consult Prof. {{ faculty_name }}."

### Workflow 3: Parent Absent Notification
* **Trigger:** `status === 'Absent'` AND `notify_parent === true`
* **Actions:**
  - Send email / Telegram message to parent:
    > "Dear Parent, your ward {{ student_name }} (Reg: {{ reg_number }}) was marked absent for {{ subject_name }} on {{ date }}."

### Workflow 4: Daily Attendance Summary (Faculty & HOD Digest)
* **Trigger:** Cron Schedule `0 17 * * 1-5` (5:00 PM Mon-Fri)
* **Actions:**
  1. Fetch daily stats via `GET /api/reports/daily?date={{ today }}`.
  2. Summarize: Total Present, Total Absent, Defaulters List.
  3. Format HTML summary and email to Department HOD and Dean.

### Workflow 5: Weekly Attendance Report
* **Trigger:** Cron Schedule `0 18 * * 5` (Friday 6:00 PM)
* **Actions:**
  1. Call backend API for week's aggregated metrics.
  2. Generate PDF/CSV attachment.
  3. Email weekly performance review to academic coordinators.

### Workflow 6: Leave Approval Notification
* **Trigger:** Webhook `POST /webhook/leave-request-update` (`status === 'Approved'`)
* **Actions:**
  - Update student dashboard.
  - Notify student: "Your leave application from {{ start_date }} to {{ end_date }} has been APPROVED by {{ faculty_name }}."

### Workflow 7: Leave Rejection Notification
* **Trigger:** Webhook `POST /webhook/leave-request-update` (`status === 'Rejected'`)
* **Actions:**
  - Notify student with faculty remarks: "Reason for rejection: {{ remarks }}."

### Workflow 8: Critical Attendance Alert (< 65%)
* **Trigger:** Real-time evaluation when student falls below 65%.
* **Actions:**
  - Trigger emergency escalation:
    1. Automated High-Priority Email to Dean, HOD, Mentor, Student & Parent.
    2. Optional Telegram bot message with read receipt tracking.
    3. Mandatory counseling appointment suggestion generated.

---

## 3. Sample n8n Webhook Payload

When faculty submits attendance, SmartAttend sends:

```json
{
  "event": "ATTENDANCE_RECORDED",
  "timestamp": "2026-09-27T10:30:00.000Z",
  "class_info": {
    "subject_code": "CS501",
    "subject_name": "Database Management Systems",
    "faculty_name": "Prof. Priya Sharma",
    "department": "CSE",
    "year": 3,
    "section": "A",
    "date": "2026-09-27",
    "time_slot": "09:00 - 10:00 AM"
  },
  "summary": {
    "total": 45,
    "present": 39,
    "absent": 6,
    "percentage": 86.67
  },
  "absent_students": [
    {
      "student_id": 1,
      "roll_number": "CSE-2023-014",
      "reg_number": "710023104014",
      "student_name": "Arun Kumar",
      "student_email": "arun.k@student.smartattend.edu",
      "parent_name": "K. Sundaram",
      "parent_email": "k.sundaram@gmail.com",
      "parent_phone": "+1-555-4001",
      "overall_attendance_pct": 68.4,
      "risk_level": "At Risk",
      "classes_needed_for_80": 8
    }
  ]
}
```

---

## 4. Setting up n8n Locally or in Cloud

1. Run n8n using Docker:
   ```bash
   docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
   ```
2. Create a new workflow in n8n.
3. Add a **Webhook** node with HTTP Method: `POST` and Path: `attendance-recorded`.
4. Add an **IF** node:
   - Check if `{{ $json.absent_students.length }} > 0`.
5. Add **Email (SMTP)** or **Telegram** nodes connected to the `true` output.
6. Copy the test/production Webhook URL into SmartAttend UI under **Admin Settings -> Automation (n8n)**.
