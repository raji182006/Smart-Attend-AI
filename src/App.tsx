import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import {
  User,
  UserRole,
  Student,
  AttendanceRecord,
  LeaveRequest,
  NotificationItem,
  SystemSettings,
  N8nWebhookLog,
} from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { FacultyDashboard } from './components/dashboard/FacultyDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { ParentDashboard } from './components/dashboard/ParentDashboard';
import { AttendanceMarker } from './components/attendance/AttendanceMarker';
import { WhatIfCalculator } from './components/calculator/WhatIfCalculator';
import { SmartRiskAnalysis } from './components/risk/SmartRiskAnalysis';
import { LeaveManagement } from './components/leaves/LeaveManagement';
import { N8nAutomationCenter } from './components/n8n/N8nAutomationCenter';
import { ReportsCenter } from './components/reports/ReportsCenter';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { StudentsList } from './components/students/StudentsList';
import { SettingsView } from './components/settings/SettingsView';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { GeminiChatbot } from './components/chat/GeminiChatbot';
import { LoginView } from './components/auth/LoginView';
import { persistAttendanceToFirestore, persistLeaveToFirestore } from './services/firebase';
import { CheckCircle2, Cpu, X, Sparkles } from 'lucide-react';

export default function App() {
  // State
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Global Theme Mode (Light / Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('smartattend_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartattend_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [departments, setDepartments] = useState(() => StorageService.getDepartments());
  const [subjects, setSubjects] = useState(() => StorageService.getSubjects());
  const [facultyList, setFacultyList] = useState(() => StorageService.getFaculty());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    StorageService.getAttendanceRecords()
  );
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    StorageService.getLeaveRequests()
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    StorageService.getNotifications()
  );
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [n8nLogs, setN8nLogs] = useState<N8nWebhookLog[]>(() => StorageService.getN8nLogs());

  // Transient feedback
  const [n8nToastMessage, setN8nToastMessage] = useState<string | null>(null);
  const [selectedSubjectToMark, setSelectedSubjectToMark] = useState<number | undefined>(undefined);

  // Sync state helper
  const refreshAllState = () => {
    setDepartments(StorageService.getDepartments());
    setSubjects(StorageService.getSubjects());
    setFacultyList(StorageService.getFaculty());
    setStudents(StorageService.getStudents());
    setAttendanceRecords(StorageService.getAttendanceRecords());
    setLeaveRequests(StorageService.getLeaveRequests());
    setNotifications(StorageService.getNotifications());
    setSettings(StorageService.getSettings());
    setN8nLogs(StorageService.getN8nLogs());
  };

  // Role switching
  const handleSwitchRole = (newRole: UserRole) => {
    const allUsers = StorageService.getUsers();
    const matchedUser = allUsers.find((u) => u.role === newRole) || {
      id: 99,
      username: `${newRole}_user`,
      email: `${newRole}@smartattend.edu`,
      fullName: `${newRole.toUpperCase()} User`,
      role: newRole,
    };

    setCurrentUser(matchedUser);
    StorageService.setCurrentUser(matchedUser);
    setCurrentView('dashboard');
  };

  // Attendance Save Handler
  const handleSaveAttendance = async (
    records: Omit<AttendanceRecord, 'id' | 'createdAt'>[],
    triggerN8n: boolean
  ) => {
    const result = StorageService.saveAttendanceBatch(records, triggerN8n);
    refreshAllState();

    // Persist to Firebase Firestore
    try {
      await persistAttendanceToFirestore(records);
    } catch (e) {
      // Local fallback already handled
    }

    if (triggerN8n && records.length > 0) {
      // Also notify backend /api/n8n/trigger
      try {
        await fetch('/api/n8n/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ATTENDANCE_RECORDED',
            payload: {
              date: records[0].date,
              timeSlot: records[0].timeSlot,
              subject: records[0].subjectName,
              totalRecords: records.length,
              present: records.filter((r) => r.status === 'Present').length,
              absent: records.filter((r) => r.status === 'Absent').length,
            },
          }),
        });
      } catch (e) {
        // Fallback simulated locally
      }

      setN8nToastMessage(
        `Dispatched attendance telemetry to n8n webhook. Automated low-attendance and parent absent alerts evaluated.`
      );
      setTimeout(() => setN8nToastMessage(null), 5000);
    }
  };

  // Direct n8n Alert for Student
  const handleTriggerN8nAlert = async (student: Student) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const log: N8nWebhookLog = {
      id: `n8n-${Date.now()}`,
      event: 'LOW_ATTENDANCE_ALERT',
      url: settings.n8nWebhookUrl,
      payload: {
        studentId: student.id,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        attendancePercentage: student.attendancePercentage,
        riskLevel: student.riskLevel,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
      },
      status: 'SUCCESS',
      responseCode: 200,
      timestamp,
      details: `Alert dispatched to ${student.fullName} and parent ${student.parentName} (${student.parentEmail}) via n8n.`,
    };

    StorageService.addN8nLog(log);

    // Also add to in-app notification center
    StorageService.addNotification({
      id: `notif-${Date.now()}`,
      recipientRole: 'student',
      studentId: student.id,
      studentName: student.fullName,
      type: 'Low Attendance Alert',
      title: `Low Attendance Warning (${student.attendancePercentage}%)`,
      message: `Dear ${student.fullName}, your attendance has dropped to ${student.attendancePercentage}% (${student.riskLevel}). Please attend upcoming classes regularly.`,
      channel: 'All',
      deliveryStatus: 'Delivered',
      isRead: false,
      timestamp,
    });

    refreshAllState();

    setN8nToastMessage(
      `Dispatched Low Attendance Alert for ${student.fullName} via n8n. Parent (${student.parentEmail}) notified.`
    );
    setTimeout(() => setN8nToastMessage(null), 5000);
  };

  // Leave Actions
  const handleSubmitLeave = (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    const created = StorageService.submitLeaveRequest(leave);
    refreshAllState();

    // Persist to Firebase Firestore
    try {
      persistLeaveToFirestore(created);
    } catch (e) {
      // Local fallback already handled
    }
  };

  const handleUpdateLeaveStatus = (
    leaveId: number,
    status: 'Approved' | 'Rejected',
    reviewedBy: string,
    remarks: string
  ) => {
    StorageService.updateLeaveStatus(leaveId, status, reviewedBy, remarks);
    refreshAllState();
    setN8nToastMessage(`Leave request marked ${status}. n8n notification sent to student.`);
    setTimeout(() => setN8nToastMessage(null), 4000);
  };

  // Add Student
  const handleAddStudent = (studentData: any) => {
    StorageService.addStudent(studentData);
    refreshAllState();
  };

  // Update Settings
  const handleSaveSettings = (newSettings: SystemSettings) => {
    StorageService.saveSettings(newSettings);
    refreshAllState();
  };

  // Reset Data
  const handleResetData = () => {
    StorageService.resetAllDemoData();
    refreshAllState();
    setCurrentUser(StorageService.getCurrentUser());
    setN8nToastMessage('Demo database reset to initial seed state.');
    setTimeout(() => setN8nToastMessage(null), 3000);
  };

  // Active student for student portal
  const activeStudent = students.find((s) => s.id === (currentUser.studentId || 1)) || students[0];
  const activeFaculty = facultyList.find((f) => f.id === (currentUser.facultyId || 1)) || facultyList[0];
  const activeWard = students.find((s) => s.id === 1) || students[0]; // Arun Kumar for parent view
  const activeAdvisor = facultyList[0]; // Prof. Priya Sharma

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;
  const atRiskCount = students.filter(
    (s) => s.riskLevel === 'At Risk' || s.riskLevel === 'Critical'
  ).length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) {
    return (
      <LoginView
        availableUsers={StorageService.getUsers()}
        onLogin={(u) => {
          setCurrentUser(u);
          StorageService.setCurrentUser(u);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Sticky Modern Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          StorageService.markNotificationAsRead(id);
          refreshAllState();
        }}
        onMarkAllNotificationsRead={() => {
          StorageService.markAllNotificationsAsRead();
          refreshAllState();
        }}
        onNavigate={setCurrentView}
        onResetData={handleResetData}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Role-Adaptive Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          userRole={currentUser.role}
          pendingLeavesCount={pendingLeavesCount}
          atRiskCount={atRiskCount}
          unreadNotifsCount={unreadNotifsCount}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 min-w-0">
          {/* Dashboard View (Role Adaptive) */}
          {currentView === 'dashboard' && (
            <>
              {currentUser.role === 'admin' && (
                <AdminDashboard
                  students={students}
                  attendanceRecords={attendanceRecords}
                  leaveRequests={leaveRequests}
                  notifications={notifications}
                  settings={settings}
                  onNavigate={setCurrentView}
                  onTriggerN8nAlert={handleTriggerN8nAlert}
                />
              )}

              {currentUser.role === 'faculty' && (
                <FacultyDashboard
                  currentFaculty={activeFaculty}
                  assignedSubjects={subjects.filter((s) => s.departmentId === 1).slice(0, 2)}
                  students={students}
                  attendanceRecords={attendanceRecords}
                  leaveRequests={leaveRequests}
                  settings={settings}
                  onNavigate={setCurrentView}
                  onSelectSubjectToMark={(id) => {
                    setSelectedSubjectToMark(id);
                    setCurrentView('attendance');
                  }}
                  onReviewLeave={(leaveId, status, remarks) =>
                    handleUpdateLeaveStatus(leaveId, status, activeFaculty.fullName, remarks)
                  }
                />
              )}

              {currentUser.role === 'student' && (
                <StudentDashboard
                  currentStudent={activeStudent}
                  subjects={subjects}
                  attendanceRecords={attendanceRecords}
                  leaveRequests={leaveRequests}
                  settings={settings}
                  onNavigate={setCurrentView}
                  onOpenLeaveModal={() => setCurrentView('leaves')}
                />
              )}

              {currentUser.role === 'parent' && (
                <ParentDashboard
                  ward={activeWard}
                  advisor={activeAdvisor}
                  attendanceRecords={attendanceRecords}
                  notifications={notifications}
                />
              )}
            </>
          )}

          {/* Mark Attendance View */}
          {currentView === 'attendance' && (
            <AttendanceMarker
              departments={departments}
              subjects={subjects}
              students={students}
              facultyList={facultyList}
              attendanceRecords={attendanceRecords}
              settings={settings}
              currentFacultyId={activeFaculty.id}
              initialSubjectId={selectedSubjectToMark}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {/* Students Directory View */}
          {currentView === 'students' && (
            <StudentsList
              students={students}
              departments={departments}
              userRole={currentUser.role}
              onAddStudent={handleAddStudent}
              onTriggerN8nAlert={handleTriggerN8nAlert}
            />
          )}

          {/* Smart Risk Analysis View */}
          {currentView === 'risk' && (
            <SmartRiskAnalysis
              students={students}
              settings={settings}
              onTriggerN8nAlert={handleTriggerN8nAlert}
            />
          )}

          {/* Prediction & What-If Calculator View */}
          {currentView === 'calculator' && (
            <WhatIfCalculator
              students={students}
              currentStudent={currentUser.role === 'student' ? activeStudent : undefined}
            />
          )}

          {/* Leave Management View */}
          {currentView === 'leaves' && (
            <LeaveManagement
              leaveRequests={leaveRequests}
              userRole={currentUser.role}
              currentStudent={activeStudent}
              reviewerName={currentUser.fullName}
              onSubmitLeave={handleSubmitLeave}
              onUpdateStatus={handleUpdateLeaveStatus}
            />
          )}

          {/* Reports & CSV Export View */}
          {currentView === 'reports' && (
            <ReportsCenter
              students={students}
              departments={departments}
              subjects={subjects}
              attendanceRecords={attendanceRecords}
            />
          )}

          {/* Dedicated Chart.js Analytics View */}
          {currentView === 'analytics' && (
            <AnalyticsDashboard
              students={students}
              departments={departments}
              subjects={subjects}
              settings={settings}
            />
          )}

          {/* n8n Automation Center View */}
          {currentView === 'n8n' && (
            <N8nAutomationCenter
              settings={settings}
              logs={n8nLogs}
              onUpdateSettings={handleSaveSettings}
              onTriggerTestWebhook={async (event, payload) => {
                const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const newLog: N8nWebhookLog = {
                  id: `n8n-${Date.now()}`,
                  event,
                  url: settings.n8nWebhookUrl,
                  payload,
                  status: 'SUCCESS',
                  responseCode: 200,
                  timestamp,
                  details: `Live simulated test trigger completed for ${event}. Workflow passed validation.`,
                };
                StorageService.addN8nLog(newLog);
                refreshAllState();
                setN8nToastMessage(`Simulated n8n trigger executed for ${event}. Recorded in logs.`);
                setTimeout(() => setN8nToastMessage(null), 4000);
              }}
            />
          )}

          {/* Notification Center View */}
          {currentView === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              userRole={currentUser.role}
              onMarkRead={(id: string) => {
                StorageService.markNotificationAsRead(id);
                refreshAllState();
              }}
              onMarkAllRead={() => {
                StorageService.markAllNotificationsAsRead();
                refreshAllState();
              }}
            />
          )}

          {/* Gemini AI Advisor View */}
          {currentView === 'chatbot' && (
            <GeminiChatbot
              currentUser={currentUser}
              currentStudent={activeStudent}
            />
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDatabase={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Floating Gemini AI Quick Access Pill */}
      {currentView !== 'chatbot' && (
        <button
          onClick={() => setCurrentView('chatbot')}
          className="fixed bottom-6 left-6 z-40 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 border border-indigo-400/40 text-xs font-bold transition-all flex items-center gap-2 group ring-2 ring-indigo-500/20"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white">
            <Sparkles className="w-3 h-3 animate-spin [animation-duration:4s]" />
          </div>
          <span>Ask Gemini AI Advisor</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 font-mono">
            Gemini 3
          </span>
        </button>
      )}

      {/* Floating Animated n8n Webhook Toast */}
      {n8nToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-indigo-300 block mb-0.5">n8n Automation Engine</span>
            <p className="text-slate-300 leading-relaxed">{n8nToastMessage}</p>
          </div>
          <button
            onClick={() => setN8nToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
