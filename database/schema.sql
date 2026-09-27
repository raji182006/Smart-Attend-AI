-- ====================================================================
-- SmartAttend AI - Production MySQL Database Schema
-- Smart Student Attendance Monitoring & Automated Notification System
-- ====================================================================

CREATE DATABASE IF NOT EXISTS smartattend_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartattend_db;

-- Disable foreign key checks during creation
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. Departments Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(20) NOT NULL UNIQUE,
    dept_name VARCHAR(150) NOT NULL,
    hod_name VARCHAR(120),
    email VARCHAR(150),
    phone VARCHAR(30),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 2. Users Table (Authentication & Core RBAC)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'student', 'parent') NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    avatar_url VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 3. Faculty Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS faculty;
CREATE TABLE faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    emp_id VARCHAR(50) NOT NULL UNIQUE,
    dept_id INT NOT NULL,
    designation VARCHAR(100) NOT NULL,
    qualification VARCHAR(100),
    joining_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_faculty_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 4. Students Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS students;
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    reg_number VARCHAR(50) NOT NULL UNIQUE,
    dept_id INT NOT NULL,
    current_year TINYINT NOT NULL COMMENT '1 to 4',
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    semester TINYINT NOT NULL COMMENT '1 to 8',
    admission_year YEAR NOT NULL,
    mentor_faculty_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT,
    CONSTRAINT fk_student_mentor FOREIGN KEY (mentor_faculty_id) REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    INDEX idx_dept_year_sec (dept_id, current_year, section)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 5. Parents Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS parents;
CREATE TABLE parents (
    parent_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    relationship ENUM('Father', 'Mother', 'Guardian') NOT NULL DEFAULT 'Father',
    occupation VARCHAR(100),
    alternate_phone VARCHAR(30),
    telegram_chat_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_parent_student (student_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 6. Subjects Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS subjects;
CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(30) NOT NULL UNIQUE,
    subject_name VARCHAR(150) NOT NULL,
    dept_id INT NOT NULL,
    semester TINYINT NOT NULL,
    credits INT DEFAULT 3,
    total_planned_hours INT DEFAULT 45,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subject_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT,
    INDEX idx_subject_dept_sem (dept_id, semester)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 7. Classes / Course Offerings Mapping
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    dept_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    current_year TINYINT NOT NULL,
    semester TINYINT NOT NULL,
    section VARCHAR(10) NOT NULL,
    room_number VARCHAR(30),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT fk_class_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE RESTRICT,
    CONSTRAINT fk_class_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT,
    UNIQUE KEY uk_class_assignment (subject_id, faculty_id, academic_year, section)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 8. Attendance Records Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
    attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    time_slot VARCHAR(50) DEFAULT '09:00 - 10:00 AM',
    status ENUM('Present', 'Absent', 'On Leave') NOT NULL DEFAULT 'Present',
    remarks VARCHAR(255) NULL,
    marked_via VARCHAR(50) DEFAULT 'web_faculty_portal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_att_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    CONSTRAINT fk_att_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE RESTRICT,
    -- Prevent duplicate attendance marking for same student, subject, date and time slot
    UNIQUE KEY uk_student_slot_date (student_id, subject_id, attendance_date, time_slot),
    INDEX idx_att_date_status (attendance_date, status),
    INDEX idx_att_student_subject (student_id, subject_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 9. Leave Requests Table
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS leave_requests;
CREATE TABLE leave_requests (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason_type ENUM('Medical', 'Family Event', 'Academic / On Duty', 'Emergency', 'Other') NOT NULL,
    reason_description TEXT NOT NULL,
    document_url VARCHAR(255) NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    reviewed_by INT NULL COMMENT 'faculty_id',
    review_remarks VARCHAR(255) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    INDEX idx_leave_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 10. Notifications Table (In-App, Email, Telegram, n8n Dispatch)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id INT NOT NULL,
    student_id INT NULL,
    notification_type ENUM(
        'Low Attendance Alert',
        'Student Absent Notification',
        'Parent Absent Notification',
        'Daily Attendance Summary',
        'Weekly Attendance Report',
        'Leave Approval Notification',
        'Leave Rejection Notification',
        'Critical Attendance Alert'
    ) NOT NULL,
    channel ENUM('In-App', 'Email', 'Telegram', 'SMS') NOT NULL DEFAULT 'In-App',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    delivery_status ENUM('Queued', 'Sent', 'Delivered', 'Failed', 'Read') NOT NULL DEFAULT 'Sent',
    n8n_execution_id VARCHAR(100) NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    CONSTRAINT fk_notif_user FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL,
    INDEX idx_notif_user_read (recipient_user_id, is_read),
    INDEX idx_notif_type (notification_type)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 11. Attendance Reports Table (Generated Cache & Metadata)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS attendance_reports;
CREATE TABLE attendance_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_title VARCHAR(200) NOT NULL,
    report_type ENUM('daily', 'weekly', 'monthly', 'student_wise', 'subject_wise', 'department_wise', 'low_attendance', 'absence') NOT NULL,
    dept_id INT NULL,
    generated_by INT NOT NULL COMMENT 'user_id',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_students INT DEFAULT 0,
    average_attendance DECIMAL(5, 2) DEFAULT 0.00,
    file_format VARCHAR(10) DEFAULT 'CSV',
    download_url VARCHAR(255) NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL,
    CONSTRAINT fk_report_user FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- 12. System Settings & Attendance Thresholds
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
    setting_key VARCHAR(60) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- Initial System Settings & Policy Thresholds
-- ====================================================================
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('threshold_safe', '80.0', 'Minimum percentage for Safe status (>= 80%)'),
('threshold_warning', '75.0', 'Percentage range for Warning status (75% - 79.9%)'),
('threshold_risk', '65.0', 'Percentage range for At Risk status (65% - 74.9%)'),
('threshold_critical', '65.0', 'Threshold below which student is in Critical status (< 65%)'),
('n8n_webhook_url', 'https://n8n.yourdomain.com/webhook/attendance-recorded', 'Active n8n incoming webhook endpoint'),
('email_alerts_enabled', 'true', 'Toggle automatic email dispatches for low attendance'),
('telegram_alerts_enabled', 'false', 'Toggle optional Telegram alerts for parents/students');

-- ====================================================================
-- Initial Seed Data for Realistic Demonstration
-- ====================================================================

-- 1. Departments
INSERT INTO departments (dept_id, dept_code, dept_name, hod_name, email, phone) VALUES
(1, 'CSE', 'Computer Science and Engineering', 'Dr. Ramesh Kumar', 'cse.hod@smartattend.edu', '+1-555-0101'),
(2, 'ECE', 'Electronics & Communication Engg.', 'Dr. Sunita Rao', 'ece.hod@smartattend.edu', '+1-555-0102'),
(3, 'IT', 'Information Technology', 'Dr. Arvind Swaminathan', 'it.hod@smartattend.edu', '+1-555-0103'),
(4, 'MECH', 'Mechanical Engineering', 'Dr. Vikram Seth', 'mech.hod@smartattend.edu', '+1-555-0104');

-- 2. Users (Pass: password123 hashed representation or demo)
INSERT INTO users (user_id, username, email, password_hash, role, full_name, phone) VALUES
(1, 'admin', 'admin@smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'admin', 'Dr. Marcus Vance (Admin)', '+1-555-1000'),
(2, 'prof_sharma', 'sharma@smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'faculty', 'Prof. Priya Sharma', '+1-555-2001'),
(3, 'prof_chen', 'chen@smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'faculty', 'Prof. Alan Chen', '+1-555-2002'),
(4, 'arun_k', 'arun.k@student.smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'student', 'Arun Kumar', '+1-555-3001'),
(5, 'sneha_r', 'sneha.r@student.smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'student', 'Sneha Reddy', '+1-555-3002'),
(6, 'rahul_m', 'rahul.m@student.smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'student', 'Rahul Menon', '+1-555-3003'),
(7, 'ananya_s', 'ananya.s@student.smartattend.edu', '$2b$10$wK1mE4yN7Z49...hash', 'student', 'Ananya Singh', '+1-555-3004'),
(8, 'arun_parent', 'k.sundaram@gmail.com', '$2b$10$wK1mE4yN7Z49...hash', 'parent', 'K. Sundaram (Arun\'s Father)', '+1-555-4001');

-- 3. Faculty records
INSERT INTO faculty (faculty_id, user_id, emp_id, dept_id, designation, qualification, joining_date) VALUES
(1, 2, 'FAC-CSE-01', 1, 'Associate Professor', 'Ph.D. Computer Science', '2019-06-15'),
(2, 3, 'FAC-CSE-02', 1, 'Assistant Professor', 'M.Tech Distributed Systems', '2021-08-01');

-- 4. Students records
INSERT INTO students (student_id, user_id, roll_number, reg_number, dept_id, current_year, section, semester, admission_year, mentor_faculty_id) VALUES
(1, 4, 'CSE-2023-014', '710023104014', 1, 3, 'A', 5, 2023, 1),
(2, 5, 'CSE-2023-042', '710023104042', 1, 3, 'A', 5, 2023, 1),
(3, 6, 'CSE-2023-028', '710023104028', 1, 3, 'A', 5, 2023, 2),
(4, 7, 'CSE-2023-005', '710023104005', 1, 3, 'A', 5, 2023, 2);

-- 5. Parents records
INSERT INTO parents (parent_id, user_id, student_id, relationship, occupation, alternate_phone) VALUES
(1, 8, 1, 'Father', 'Senior Project Manager', '+1-555-4099');

-- 6. Subjects
INSERT INTO subjects (subject_id, subject_code, subject_name, dept_id, semester, credits, total_planned_hours) VALUES
(1, 'CS501', 'Database Management Systems', 1, 5, 4, 48),
(2, 'CS502', 'Design and Analysis of Algorithms', 1, 5, 4, 50),
(3, 'CS503', 'Operating Systems & System Programming', 1, 5, 3, 42),
(4, 'CS504', 'Cloud Computing & Distributed Systems', 1, 5, 3, 40);

-- 7. Classes / Course Offerings
INSERT INTO classes (class_id, subject_id, faculty_id, dept_id, academic_year, current_year, semester, section, room_number) VALUES
(1, 1, 1, 1, '2026-2027', 3, 5, 'A', 'CS-Lab 3 / Room 302'),
(2, 2, 1, 1, '2026-2027', 3, 5, 'A', 'Hall 201'),
(3, 3, 2, 1, '2026-2027', 3, 5, 'A', 'Room 305'),
(4, 4, 2, 1, '2026-2027', 3, 5, 'A', 'Room 306');
