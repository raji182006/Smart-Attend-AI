import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Percent,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Download,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Student, AttendanceRecord, LeaveRequest, NotificationItem, SystemSettings } from '../../types';
import { getRiskBadgeClasses } from '../../utils/calculations';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import '../../utils/chartSetup';

interface AdminDashboardProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  onNavigate: (view: string) => void;
  onTriggerN8nAlert: (student: Student) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  attendanceRecords,
  leaveRequests,
  notifications,
  settings,
  onNavigate,
  onTriggerN8nAlert,
}) => {
  // Calculations
  const totalStudents = students.length;

  // Today's attendance records (using 2026-09-27 as current date)
  const todayStr = '2026-09-27';
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  const presentToday = todayRecords.filter((r) => r.status === 'Present').length;
  const absentToday = todayRecords.filter((r) => r.status === 'Absent').length;

  const atRiskStudents = students.filter(
    (s) => s.riskLevel === 'At Risk' || s.riskLevel === 'Critical'
  );

  const avgAttendance =
    students.length > 0
      ? Math.round(
          (students.reduce((acc, s) => acc + s.attendancePercentage, 0) / students.length) * 10
        ) / 10
      : 0;

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;

  // Chart Data: Present vs Absent Today
  const donutData = {
    labels: ['Present Today', 'Absent Today'],
    datasets: [
      {
        data: [presentToday || 6, absentToday || 2],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Chart Data: Weekly Attendance Trend
  const weeklyTrendData = {
    labels: ['Mon (Sep 21)', 'Tue (Sep 22)', 'Wed (Sep 23)', 'Thu (Sep 24)', 'Fri (Sep 25)', 'Today (Sep 27)'],
    datasets: [
      {
        label: 'Overall Attendance %',
        data: [82.5, 84.1, 79.8, 83.2, 85.0, avgAttendance],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4,
      },
    ],
  };

  // Chart Data: Department-wise comparison
  const deptData = {
    labels: ['CSE', 'ECE', 'IT', 'MECH'],
    datasets: [
      {
        label: 'Average Attendance %',
        data: [avgAttendance, 84.5, 79.2, 86.8],
        backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#10b981'],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30 mb-3 backdrop-blur-sm">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Automated n8n Webhook Active • MySQL Ready
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1 leading-relaxed">
              Real-time attendance telemetry, smart risk analysis, and automated notification triggers for students and parents.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => onNavigate('n8n')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-indigo-400" />
              n8n Automation Hub
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Reports
            </button>
          </div>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Students</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Enrolled Semester 5</p>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Present Today</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-600">{presentToday}</p>
            <p className="text-[11px] text-emerald-600/80 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              Active in session
            </p>
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Absent Today</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-rose-600">{absentToday}</p>
            <p className="text-[11px] text-rose-600/80 font-medium mt-0.5">
              n8n alerts dispatched
            </p>
          </div>
        </div>

        {/* Card 4: Students At Risk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-orange-200 transition-all cursor-pointer" onClick={() => onNavigate('risk')}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Students At Risk</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-orange-600">{atRiskStudents.length}</p>
            <p className="text-[11px] text-orange-600/90 font-medium mt-0.5">
              Below {settings.warningThreshold}% policy
            </p>
          </div>
        </div>

        {/* Card 5: Average Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Attendance</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-indigo-700">{avgAttendance}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Safe threshold: {settings.safeThreshold}%</p>
          </div>
        </div>

        {/* Card 6: Pending Leaves */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-200 transition-all cursor-pointer" onClick={() => onNavigate('leaves')}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Leaves</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-600">{pendingLeaves}</p>
            <p className="text-[11px] text-amber-600/90 font-medium mt-0.5">Needs approval</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Weekly Attendance Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Weekly Attendance Trend</h3>
              <p className="text-xs text-slate-500">Day-by-day aggregate across all departments</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              Current Week
            </span>
          </div>
          <div className="h-64">
            <Line
              data={weeklyTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    min: 60,
                    max: 100,
                    ticks: {
                      callback: (value) => `${value}%`,
                    },
                  },
                },
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Present vs Absent Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Today's Class Ratio</h3>
                <p className="text-xs text-slate-500">Real-time Present vs Absent</p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Sep 27</span>
            </div>
            <div className="h-48 flex items-center justify-center">
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 12, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50">
              <span className="text-emerald-700 font-bold block text-base">{presentToday}</span>
              <span className="text-emerald-600 text-[10px]">Present</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50">
              <span className="text-rose-700 font-bold block text-base">{absentToday}</span>
              <span className="text-rose-600 text-[10px]">Absent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Students At Risk Priority Table & n8n Automation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk Students Priority Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Students At Risk Monitor</h3>
                <p className="text-xs text-slate-500">Attendance below warning threshold ({settings.warningThreshold}%)</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('risk')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
            >
              Full Risk Analysis <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Classes to 75%</th>
                  <th className="py-3 px-4 text-right">Automation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      All students currently maintain safe attendance levels!
                    </td>
                  </tr>
                ) : (
                  atRiskStudents.map((s) => {
                    const badge = getRiskBadgeClasses(s.riskLevel);
                    // Approximate classes needed for 75%
                    const needed = Math.max(
                      1,
                      Math.ceil((0.75 * s.totalClasses - s.presentClasses) / (1 - 0.75))
                    );

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {s.fullName}
                          <span className="block text-[11px] font-normal text-slate-400">
                            Parent: {s.parentName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {s.rollNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {s.attendancePercentage}%
                          <span className="block text-[10px] font-normal text-slate-400">
                            {s.presentClasses}/{s.totalClasses} classes
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {s.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {needed > 0 ? (
                            <span className="text-amber-700 font-semibold">+{needed} classes</span>
                          ) : (
                            <span className="text-emerald-700">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onTriggerN8nAlert(s)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Cpu className="w-3 h-3 text-indigo-500" />
                            Trigger n8n Alert
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* n8n Automation Feeds & System Health */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">n8n Automation Status</h3>
                  <p className="text-xs text-slate-500">Live webhook pipeline</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-semibold mb-1">
                  <span>Webhook Endpoint</span>
                  <span className="text-emerald-600 font-mono text-[10px]">200 OK</span>
                </div>
                <p className="font-mono text-[10px] text-slate-500 truncate">
                  {settings.n8nWebhookUrl}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Workflows
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-700">1. Low Attendance Alert (&lt; 75%)</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-700">2. Student & Parent Absent SMS</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-700">3. Daily Attendance Digest</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    17:00 Daily
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-slate-700">4. Telegram Parent Notifications</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('n8n')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Open n8n Automation Center <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
