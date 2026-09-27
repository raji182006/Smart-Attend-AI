import {
  Department,
  Subject,
  FacultyMember,
  Student,
  AttendanceRecord,
  LeaveRequest,
  NotificationItem,
  SystemSettings,
  N8nWebhookLog,
  User,
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_SUBJECTS,
  INITIAL_FACULTY,
  INITIAL_STUDENTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_N8N_LOGS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_USERS,
} from '../data/mockData';
import { DEFAULT_SETTINGS, calculateAttendancePercentage, getRiskLevel } from '../utils/calculations';

const STORAGE_KEYS = {
  USERS: 'smartattend_users',
  CURRENT_USER: 'smartattend_current_user',
  DEPARTMENTS: 'smartattend_departments',
  SUBJECTS: 'smartattend_subjects',
  FACULTY: 'smartattend_faculty',
  STUDENTS: 'smartattend_students',
  ATTENDANCE: 'smartattend_attendance',
  LEAVES: 'smartattend_leaves',
  NOTIFICATIONS: 'smartattend_notifications',
  SETTINGS: 'smartattend_settings',
  N8N_LOGS: 'smartattend_n8n_logs',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save failed:', e);
  }
}

export const StorageService = {
  // Current logged in user
  getCurrentUser(): User {
    return getItem<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]); // default admin
  },
  setCurrentUser(user: User): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  // Users list
  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  // Departments
  getDepartments(): Department[] {
    return getItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  // Subjects
  getSubjects(): Subject[] {
    return getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  },

  // Faculty
  getFaculty(): FacultyMember[] {
    return getItem<FacultyMember[]>(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
  },

  // Students
  getStudents(): Student[] {
    return getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  saveStudents(students: Student[]): void {
    setItem(STORAGE_KEYS.STUDENTS, students);
  },
  addStudent(studentData: Omit<Student, 'id' | 'userId' | 'totalClasses' | 'presentClasses' | 'absentClasses' | 'attendancePercentage' | 'riskLevel' | 'trend'>): Student {
    const students = this.getStudents();
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      userId: 100 + newId,
      totalClasses: 30,
      presentClasses: 27,
      absentClasses: 3,
      attendancePercentage: 90,
      riskLevel: 'Safe',
      trend: 'stable',
    };
    const updated = [newStudent, ...students];
    this.saveStudents(updated);
    return newStudent;
  },

  // Attendance Records
  getAttendanceRecords(): AttendanceRecord[] {
    return getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
  },
  saveAttendanceBatch(
    records: Omit<AttendanceRecord, 'id' | 'createdAt'>[],
    triggerN8n: boolean = true
  ): { savedCount: number; n8nTriggered: boolean; n8nLog?: N8nWebhookLog } {
    const existing = this.getAttendanceRecords();
    const students = this.getStudents();
    const settings = this.getSettings();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newRecords: AttendanceRecord[] = [];
    const absentStudentNames: string[] = [];

    // Filter out existing duplicates for the same student, subject, date, time slot
    records.forEach((rec) => {
      const existsIndex = existing.findIndex(
        (e) =>
          e.studentId === rec.studentId &&
          e.subjectId === rec.subjectId &&
          e.date === rec.date &&
          e.timeSlot === rec.timeSlot
      );

      const recordItem: AttendanceRecord = {
        ...rec,
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: timestamp,
      };

      if (existsIndex >= 0) {
        // Update existing record
        existing[existsIndex] = recordItem;
      } else {
        newRecords.push(recordItem);
      }

      if (rec.status === 'Absent') {
        absentStudentNames.push(rec.studentName || `Student #${rec.studentId}`);
      }

      // Update student running statistics
      const studentIdx = students.findIndex((s) => s.id === rec.studentId);
      if (studentIdx >= 0) {
        const student = students[studentIdx];
        if (existsIndex < 0) {
          student.totalClasses += 1;
          if (rec.status === 'Present') {
            student.presentClasses += 1;
          } else {
            student.absentClasses += 1;
          }
        }
        student.attendancePercentage = calculateAttendancePercentage(
          student.presentClasses,
          student.totalClasses
        );
        student.riskLevel = getRiskLevel(student.attendancePercentage, settings);
      }
    });

    const combined = [...newRecords, ...existing];
    setItem(STORAGE_KEYS.ATTENDANCE, combined);
    this.saveStudents(students);

    // Optional n8n simulation log
    let n8nLog: N8nWebhookLog | undefined;
    if (triggerN8n && records.length > 0) {
      const presentCount = records.filter((r) => r.status === 'Present').length;
      const absentCount = records.filter((r) => r.status === 'Absent').length;
      n8nLog = {
        id: `n8n-${Date.now()}`,
        event: 'ATTENDANCE_RECORDED',
        url: settings.n8nWebhookUrl,
        payload: {
          event: 'ATTENDANCE_RECORDED',
          date: records[0].date,
          timeSlot: records[0].timeSlot,
          subjectId: records[0].subjectId,
          total: records.length,
          present: presentCount,
          absent: absentCount,
          defaulters: absentStudentNames,
        },
        status: 'SUCCESS',
        responseCode: 200,
        timestamp,
        details: `Dispatched payload to n8n webhook. Evaluated ${records.length} students. ${absentCount} absent notification triggers dispatched.`,
      };
      this.addN8nLog(n8nLog);

      // Create in-app notifications if absences were noted
      if (absentCount > 0) {
        this.addNotification({
          id: `notif-${Date.now()}`,
          recipientRole: 'admin',
          type: 'Student Absent Notification',
          title: `Attendance Recorded: ${absentCount} Absent`,
          message: `${records[0].subjectName || 'Class'}: ${presentCount} Present, ${absentCount} Absent on ${records[0].date}. Automated alerts forwarded to n8n.`,
          channel: 'All',
          deliveryStatus: 'Delivered',
          isRead: false,
          timestamp,
        });
      }
    }

    return {
      savedCount: records.length,
      n8nTriggered: triggerN8n,
      n8nLog,
    };
  },

  // Leave Requests
  getLeaveRequests(): LeaveRequest[] {
    return getItem<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS);
  },
  saveLeaveRequests(leaves: LeaveRequest[]): void {
    setItem(STORAGE_KEYS.LEAVES, leaves);
  },
  submitLeaveRequest(leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>): LeaveRequest {
    const leaves = this.getLeaveRequests();
    const newId = leaves.length > 0 ? Math.max(...leaves.map(l => l.id)) + 1 : 1;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLeave: LeaveRequest = {
      ...leave,
      id: newId,
      status: 'Pending',
      appliedAt: timestamp,
    };
    this.saveLeaveRequests([newLeave, ...leaves]);

    // Send notification to faculty/admin
    this.addNotification({
      id: `notif-${Date.now()}`,
      recipientRole: 'faculty',
      type: 'Leave Approval Notification',
      title: 'New Leave Request Received',
      message: `${leave.studentName} (${leave.rollNumber}) submitted a leave application for ${leave.startDate} to ${leave.endDate}.`,
      channel: 'In-App',
      deliveryStatus: 'Delivered',
      isRead: false,
      timestamp,
    });

    return newLeave;
  },
  updateLeaveStatus(
    leaveId: number,
    status: 'Approved' | 'Rejected',
    reviewedBy: string,
    remarks: string
  ): void {
    const leaves = this.getLeaveRequests();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const idx = leaves.findIndex((l) => l.id === leaveId);
    if (idx >= 0) {
      leaves[idx].status = status;
      leaves[idx].reviewedBy = reviewedBy;
      leaves[idx].reviewRemarks = remarks;
      leaves[idx].reviewedAt = timestamp;
      this.saveLeaveRequests(leaves);

      // Notify student
      this.addNotification({
        id: `notif-${Date.now()}`,
        recipientRole: 'student',
        studentId: leaves[idx].studentId,
        studentName: leaves[idx].studentName,
        type: status === 'Approved' ? 'Leave Approval Notification' : 'Leave Rejection Notification',
        title: `Leave Request ${status}`,
        message: `Your leave application (${leaves[idx].startDate} to ${leaves[idx].endDate}) has been ${status.toUpperCase()} by ${reviewedBy}. Remarks: ${remarks || 'None'}`,
        channel: 'All',
        deliveryStatus: 'Delivered',
        isRead: false,
        timestamp,
      });

      // Also log n8n trigger
      this.addN8nLog({
        id: `n8n-${Date.now()}`,
        event: `LEAVE_REQUEST_${status.toUpperCase()}`,
        url: this.getSettings().n8nWebhookUrl,
        payload: {
          leaveId,
          student: leaves[idx].studentName,
          status,
          reviewedBy,
          remarks,
        },
        status: 'SUCCESS',
        responseCode: 200,
        timestamp,
        details: `Dispatched ${status} notice to n8n email/telegram pipeline.`,
      });
    }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  saveNotifications(notifs: NotificationItem[]): void {
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  addNotification(notif: NotificationItem): void {
    const list = this.getNotifications();
    this.saveNotifications([notif, ...list]);
  },
  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  },
  markAllNotificationsAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  },

  // Settings
  getSettings(): SystemSettings {
    return getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },
  saveSettings(settings: SystemSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    // Re-evaluate students risk levels when thresholds change
    const students = this.getStudents();
    const updated = students.map((s) => ({
      ...s,
      riskLevel: getRiskLevel(s.attendancePercentage, settings),
    }));
    this.saveStudents(updated);
  },

  // n8n Logs
  getN8nLogs(): N8nWebhookLog[] {
    return getItem<N8nWebhookLog[]>(STORAGE_KEYS.N8N_LOGS, INITIAL_N8N_LOGS);
  },
  addN8nLog(log: N8nWebhookLog): void {
    const list = this.getN8nLogs();
    setItem(STORAGE_KEYS.N8N_LOGS, [log, ...list.slice(0, 49)]); // keep latest 50
  },

  // Reset to initial demo state
  resetAllDemoData(): void {
    localStorage.clear();
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    setItem(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    setItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    setItem(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
    setItem(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    setItem(STORAGE_KEYS.N8N_LOGS, INITIAL_N8N_LOGS);
  },
};
