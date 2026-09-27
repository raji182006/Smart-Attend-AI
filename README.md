# SmartAttend AI – Smart Student Attendance Monitoring & Automated Notification System

SmartAttend AI is a college-grade, production-ready attendance management and intelligent notification web application. Designed as a capstone internship project, it blends real-time attendance tracking with smart risk-prediction calculations and workflow automation via **n8n**.

---

## 🌟 Key Features

### 1. Multi-Role Portals
- 🛡️ **Admin Portal:** System-wide dashboard, student/faculty/subject management, attendance policy threshold settings, automated notification log inspection, and n8n webhook monitoring.
- 🧑‍🏫 **Faculty Portal:** Class & subject selector (Department, Year, Section, Subject, Date, Slot), single-click "Mark All Present", quick search by name or register number, duplicate-marking prevention, low-attendance flags, and leave request approval workflow.
- 🎓 **Student Portal:** Subject-wise percentage breakdown, attendance status indicator, absent calendar logs, leave submission module, and the **What-If Attendance Prediction Calculator**.
- 👨‍👩‍👧 **Parent Portal:** Streamlined overview of ward's attendance metrics, alerts for consecutive absences, risk status notices, and direct contact details for faculty advisors.

### 2. Smart Attendance Risk Engine
- Categorizes students into:
  - 🟢 **Safe:** $\ge 80\%$ (or custom admin threshold)
  - 🟡 **Warning:** $75\% - 79.9\%$
  - 🟠 **At Risk:** $65\% - 74.9\%$
  - 🔴 **Critical:** $< 65\%$
- Calculates mathematically exact **"Classes needed to recover to Safe threshold"** and **"Classes you can miss without dropping below threshold"**.
- Generates smart, objective guidance recommendations for students.

### 3. Predictive "What-If" Calculator
Students and faculty can simulate future attendance scenarios:
- Input current metrics or pick from registered subjects.
- Enter upcoming scheduled lectures and estimated attendance.
- Simulate the impact of missing $N$ consecutive upcoming lectures.

### 4. n8n Automation Workflows
Automated event hooks trigger n8n workflows for:
1. Low Attendance Alerts (Email & SMS/Telegram)
2. Student Absent Notifications
3. Parent Absent Notifications
4. Daily Attendance Summaries
5. Weekly Attendance Reports
6. Leave Approval Notifications
7. Leave Rejection Notifications
8. Critical Attendance Escalations (< 65%)

### 5. Reporting & Analytics
- Visual dashboard powered by **Chart.js**.
- Department comparison, subject averages, attendance trends, and risk distribution charts.
- Export attendance summaries directly to **CSV** or print-ready formatting.

### 6. Gemini Multi-Turn AI Advisor Chatbot
- **Interactive Multi-Turn Dialogue**: Maintains complete conversation history and scrollable thread.
- **Dynamic Model Selection**:
  - `gemini-3.1-pro-preview` for particularly complex policy and mathematical tasks.
  - `gemini-3.5-flash` for general academic advising and counseling tasks.
  - `gemini-3.1-flash-lite` for high-speed calculation tips.
- **Role-Based Personas**: Academic Counselor, Faculty Communication Specialist, What-If Strategist, and n8n Automation Architect.
- **Suggested Prompts & History Actions**: Instant 1-click test prompts and copy replies.


---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, Chart.js, react-chartjs-2 |
| **Backend** | Node.js, Express.js REST API, tsx runner |
| **Database** | MySQL 8.0 (DDL schema in `database/schema.sql` + fast in-memory reactive state) |
| **Automation** | n8n Webhook Integration |
| **AI Insights** | Smart analytic risk engine + Google Gemini API |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 3. Run the Development Server
```bash
npm run dev
```
The app will be available on `http://localhost:3000`.

### 4. Database Setup (MySQL)
Run the script in `database/schema.sql`:
```bash
mysql -u root -p < database/schema.sql
```

---

## 🔐 Demo Accounts (1-Click Switcher Available in UI)

| Role | Username | Password | Notes |
|---|---|---|---|
| **Admin** | `admin` | `password123` | Dr. Marcus Vance (Full System Access) |
| **Faculty** | `prof_sharma` | `password123` | Prof. Priya Sharma (CSE Dept) |
| **Student** | `arun_k` | `password123` | Arun Kumar (At-Risk attendance demo) |
| **Student** | `sneha_r` | `password123` | Sneha Reddy (High attendance demo) |
| **Parent** | `arun_parent` | `password123` | K. Sundaram (Arun's Father) |
