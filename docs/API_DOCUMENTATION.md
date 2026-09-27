# SmartAttend AI - REST API Documentation

This document describes the REST API endpoints exposed by the SmartAttend backend service (`/api/*`).

---

## Base URL
`/api`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and starts a session.
* **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "password123",
    "role": "admin"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "user_id": 1,
      "username": "admin",
      "email": "admin@smartattend.edu",
      "role": "admin",
      "full_name": "Dr. Marcus Vance (Admin)",
      "token": "demo_jwt_token_admin_1"
    }
  }
  ```

---

## 2. Students & Academic Data (`/api/students`)

### `GET /api/students`
Fetches students with current attendance statistics and risk status.
* **Query Parameters:**
  - `dept_id` (optional): Filter by department
  - `year` (optional): Filter by current year (1-4)
  - `section` (optional): Filter by section ('A', 'B')
  - `risk_level` (optional): 'Safe', 'Warning', 'At Risk', 'Critical'
  - `search` (optional): Match student name or roll number

### `POST /api/students`
Creates a new student record (Admin role).
* **Request Body:**
  ```json
  {
    "full_name": "Sneha Reddy",
    "email": "sneha.r@student.smartattend.edu",
    "roll_number": "CSE-2023-042",
    "reg_number": "710023104042",
    "dept_id": 1,
    "current_year": 3,
    "section": "A",
    "semester": 5,
    "parent_name": "R. Ramesh Reddy",
    "parent_email": "ramesh.reddy@gmail.com",
    "parent_phone": "+1-555-4002"
  }
  ```

---

## 3. Attendance Operations (`/api/attendance`)

### `GET /api/attendance`
Retrieves attendance records with filters.
* **Query Parameters:** `date`, `subject_id`, `student_id`, `dept_id`

### `POST /api/attendance/mark`
Bulk marks attendance for a class session. Prevents duplicate marking for the same slot.
* **Request Body:**
  ```json
  {
    "subject_id": 1,
    "faculty_id": 1,
    "attendance_date": "2026-09-27",
    "time_slot": "09:00 - 10:00 AM",
    "records": [
      { "student_id": 1, "status": "Present", "remarks": "" },
      { "student_id": 2, "status": "Absent", "remarks": "Unexcused" }
    ]
  }
  ```
* **Response (200 OK):**
  Triggers automatic n8n webhook dispatch and returns saved summary.

---

## 4. Leave Management (`/api/leaves`)

### `GET /api/leaves`
* **Query Parameters:** `student_id`, `status` ('Pending', 'Approved', 'Rejected')

### `POST /api/leaves`
Student submits a leave request.
* **Request Body:**
  ```json
  {
    "student_id": 1,
    "start_date": "2026-09-30",
    "end_date": "2026-10-01",
    "reason_type": "Medical",
    "reason_description": "Seasonal flu symptoms, physician prescription attached",
    "document_url": "medical_certificate_01.pdf"
  }
  ```

### `PATCH /api/leaves/:id/status`
Faculty/Admin approves or rejects a leave request.
* **Request Body:**
  ```json
  {
    "status": "Approved",
    "reviewed_by": 1,
    "review_remarks": "Approved. Please submit handwritten lab assignments upon return."
  }
  ```

---

## 5. Automated Notifications (`/api/notifications`)

### `GET /api/notifications`
* **Query Parameters:** `user_id`, `role`, `unread_only`

### `POST /api/notifications`
Dispatches an in-app and webhook-backed notification.

### `PATCH /api/notifications/:id/read`
Marks notification as read.

---

## 6. Automation & n8n (`/api/n8n`)

### `POST /api/n8n/trigger-test`
Simulates firing an n8n webhook payload with live execution results and logs.

### `GET /api/n8n/logs`
Returns the recent notification delivery logs.

---

## 7. Reports & Analytics (`/api/reports`)

### `GET /api/reports/analytics`
Returns aggregate statistics, subject-wise trends, risk distributions, and department breakdowns for Chart.js visualization.

### `GET /api/reports/export-csv`
Generates downloadable CSV data for attendance summaries.

---

## 8. Gemini Multi-Turn AI Advisor (`/api/chat`)

### `POST /api/chat`
Handles multi-turn conversational AI interactions with dynamic model tier routing and persona system instructions.
* **Models Supported:**
  - `gemini-3.1-pro-preview` (Complex academic policy reasoning and mathematical modeling)
  - `gemini-3.5-flash` (General student and faculty counseling tasks)
  - `gemini-3.1-flash-lite` (High-speed tips and quick metric checks)
* **Request Body:**
  ```json
  {
    "messages": [
      { "role": "user", "content": "I have 68% attendance. How many classes do I need to attend to reach 80%?" }
    ],
    "model": "gemini-3.5-flash",
    "systemInstruction": "You are SmartAttend AI, an expert academic attendance counselor..."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "reply": "To reach the 80% safe zone from your current 68.4% attendance, you must attend the next 8 consecutive lectures without absence...",
    "model": "gemini-3.5-flash",
    "timestamp": "2026-09-27T10:35:00.000Z"
  }
  ```

