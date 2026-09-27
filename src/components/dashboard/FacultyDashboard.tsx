import React from 'react';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
  FileBarChart,
} from 'lucide-react';
import {
  FacultyMember,
  Subject,
  Student,
  AttendanceRecord,
  LeaveRequest,
  SystemSettings,
} from '../../types';
import { getRiskBadgeClasses } from '../../utils/calculations';

interface FacultyDashboardProps {
  currentFaculty: FacultyMember;
  assignedSubjects: Subject[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  settings: SystemSettings;
  onNavigate: (view: string) => void;
  onSelectSubjectToMark: (subjectId: number) => void;
  onReviewLeave: (leaveId: number, status: 'Approved' | 'Rejected', remarks: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentFaculty,
  assignedSubjects,
  students,
  attendanceRecords,
  leaveRequests,
  settings,
  onNavigate,
  onSelectSubjectToMark,
  onReviewLeave,
}) => {
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending');
  const atRiskStudents = students.filter(
    (s) => s.riskLevel === 'At Risk' || s.riskLevel === 'Critical'
  );

  return (
    <div className="space-y-6">
      {/* Faculty Welcome Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 mb-3 backdrop-blur-sm">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              Faculty Academic Console • {currentFaculty.departmentName}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentFaculty.fullName}
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl mt-1 leading-relaxed">
              {currentFaculty.designation} • Emp ID: {currentFaculty.empId}. Ready to record today&apos;s lectures and evaluate student progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => onNavigate('leaves')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-emerald-300" />
              Leave Approvals ({pendingLeaves.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Assigned Subjects</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{assignedSubjects.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Semester 5 Classes</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Enrolled Students</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{students.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Section A</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Defaulters at Risk</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-orange-600">{atRiskStudents.length}</p>
            <p className="text-[11px] text-orange-600/90 font-medium mt-0.5">
              Attendance &lt; {settings.warningThreshold}%
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Leaves</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-600">{pendingLeaves.length}</p>
            <p className="text-[11px] text-amber-600/90 font-medium mt-0.5">Awaiting decision</p>
          </div>
        </div>
      </div>

      {/* Assigned Subjects with Direct "Mark Attendance" Action */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">My Course Offerings</h3>
            <p className="text-xs text-slate-500">Select a course to record attendance or inspect roster statistics</p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
          >
            Go to Attendance Register <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedSubjects.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {sub.code}
                  </span>
                  <span className="text-[11px] text-slate-500">{sub.credits} Credits • {sub.totalPlannedHours} Hours</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{sub.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Year 3 • Section A • Semester 5</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Enrolled: <strong className="text-slate-800">{students.length} students</strong>
                </span>
                <button
                  onClick={() => {
                    onSelectSubjectToMark(sub.id);
                    onNavigate('attendance');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Mark Session
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Pending Leave Requests & Defaulters Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Pending Leave Requests</h3>
                <p className="text-xs text-slate-500">Student applications awaiting your sanction</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('leaves')}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No pending leave applications at this time.
              </div>
            ) : (
              pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{leave.studentName}</span>
                    <span className="font-mono text-[11px] text-slate-500">{leave.rollNumber}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{leave.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Dates: <strong>{leave.startDate}</strong> to <strong>{leave.endDate}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200 text-[10px]">
                      {leave.reasonType}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        onReviewLeave(leave.id, 'Rejected', 'Insufficient attendance buffer.')
                      }
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        onReviewLeave(leave.id, 'Approved', 'Approved by faculty.')
                      }
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Attendance Defaulters in My Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Attendance Risk Watchlist</h3>
                <p className="text-xs text-slate-500">Requires academic counseling</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('risk')}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
            >
              Analyze
            </button>
          </div>

          <div className="space-y-2.5">
            {atRiskStudents.map((s) => {
              const badge = getRiskBadgeClasses(s.riskLevel);
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-800">{s.fullName}</h5>
                    <p className="text-slate-400 text-[11px] font-mono">{s.rollNumber} • Parent: {s.parentPhone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.badge}`}>
                      {s.attendancePercentage}% ({s.riskLevel})
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {s.presentClasses}/{s.totalClasses} classes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
