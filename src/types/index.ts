export type UserRole = 'admin' | 'faculty' | 'student' | 'parent';

export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave';

export type RiskLevel = 'Safe' | 'Warning' | 'At Risk' | 'Critical';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  departmentId?: number;
  studentId?: number;
  facultyId?: number;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  hodName: string;
  email: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  semester: number;
  credits: number;
  totalPlannedHours: number;
}

export interface FacultyMember {
  id: number;
  userId: number;
  empId: string;
  fullName: string;
  email: string;
  departmentId: number;
  departmentName?: string;
  designation: string;
  assignedSubjectIds: number[];
}

export interface Student {
  id: number;
  userId: number;
  fullName: string;
  rollNumber: string;
  regNumber: string;
  departmentId: number;
  departmentName?: string;
  year: number; // 1, 2, 3, 4
  section: string; // 'A', 'B'
  semester: number;
  email: string;
  phone: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentId?: number;
  // Computed stats
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  attendancePercentage: number;
  riskLevel: RiskLevel;
  trend: 'improving' | 'declining' | 'stable';
}

export interface AttendanceRecord {
  id: string;
  studentId: number;
  studentName?: string;
  rollNumber?: string;
  subjectId: number;
  subjectName?: string;
  subjectCode?: string;
  facultyId: number;
  facultyName?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  status: AttendanceStatus;
  remarks?: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  startDate: string;
  endDate: string;
  reasonType: 'Medical' | 'Family Event' | 'Academic / On Duty' | 'Emergency' | 'Other';
  description: string;
  documentUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewRemarks?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface NotificationItem {
  id: string;
  recipientRole: UserRole | 'all';
  recipientUserId?: number;
  studentId?: number;
  studentName?: string;
  type: 
    | 'Low Attendance Alert'
    | 'Student Absent Notification'
    | 'Parent Absent Notification'
    | 'Daily Attendance Summary'
    | 'Weekly Attendance Report'
    | 'Leave Approval Notification'
    | 'Leave Rejection Notification'
    | 'Critical Attendance Alert'
    | 'System Announcement';
  title: string;
  message: string;
  channel: 'In-App' | 'Email' | 'Telegram' | 'All';
  deliveryStatus: 'Sent' | 'Delivered' | 'Queued' | 'Failed';
  isRead: boolean;
  timestamp: string;
}

export interface SystemSettings {
  safeThreshold: number; // e.g. 80
  warningThreshold: number; // e.g. 75
  riskThreshold: number; // e.g. 65
  criticalThreshold: number; // below 65
  n8nWebhookUrl: string;
  n8nWebhookSecret: string;
  emailAlertsEnabled: boolean;
  telegramAlertsEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
}

export interface N8nWebhookLog {
  id: string;
  event: string;
  url: string;
  payload: any;
  status: 'SUCCESS' | 'SIMULATED' | 'FAILED';
  responseCode: number;
  timestamp: string;
  details: string;
}

export interface RiskAnalysisItem {
  student: Student;
  currentPercentage: number;
  riskLevel: RiskLevel;
  classesNeededForSafe: number;
  classesCanMissBeforeRisk: number;
  recommendation: string;
  subjectWise: {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    total: number;
    present: number;
    percentage: number;
    riskLevel: RiskLevel;
  }[];
}
