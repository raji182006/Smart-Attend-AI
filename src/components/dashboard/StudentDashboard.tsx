import React from 'react';
import {
  GraduationCap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calculator,
  PlusCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  BookOpen,
} from 'lucide-react';
import {
  Student,
  Subject,
  AttendanceRecord,
  LeaveRequest,
  SystemSettings,
} from '../../types';
import {
  calculateClassesNeeded,
  calculateClassesCanMiss,
  getRiskBadgeClasses,
  generateSmartRecommendation,
} from '../../utils/calculations';

interface StudentDashboardProps {
  currentStudent: Student;
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  settings: SystemSettings;
  onNavigate: (view: string) => void;
  onOpenLeaveModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentStudent,
  subjects,
  attendanceRecords,
  leaveRequests,
  settings,
  onNavigate,
  onOpenLeaveModal,
}) => {
  const badge = getRiskBadgeClasses(currentStudent.riskLevel);

  // Student specific attendance records
  const myRecords = attendanceRecords.filter((r) => r.studentId === currentStudent.id);
  const myAbsences = myRecords.filter((r) => r.status === 'Absent');
  const myLeaves = leaveRequests.filter((l) => l.studentId === currentStudent.id);

  // Mathematical recovery formulas
  const classesNeeded75 = calculateClassesNeeded(
    currentStudent.presentClasses,
    currentStudent.totalClasses,
    settings.warningThreshold || 75
  );
  const classesNeeded80 = calculateClassesNeeded(
    currentStudent.presentClasses,
    currentStudent.totalClasses,
    settings.safeThreshold || 80
  );
  const canMiss75 = calculateClassesCanMiss(
    currentStudent.presentClasses,
    currentStudent.totalClasses,
    settings.warningThreshold || 75
  );

  const smartAdvice = generateSmartRecommendation(
    currentStudent.fullName,
    currentStudent.attendancePercentage,
    classesNeeded75,
    classesNeeded80,
    canMiss75
  );

  // Mock subject-wise breakdown for realism
  const subjectBreakdown = subjects.map((sub, idx) => {
    // Generate realistic distribution around overall student performance
    const subTotal = 10;
    let subPresent = 8;
    if (currentStudent.attendancePercentage < 70) {
      subPresent = idx % 2 === 0 ? 6 : 7;
    } else if (currentStudent.attendancePercentage > 85) {
      subPresent = 9;
    }
    const subPct = Math.round((subPresent / subTotal) * 100);
    return {
      ...sub,
      total: subTotal,
      present: subPresent,
      absent: subTotal - subPresent,
      percentage: subPct,
    };
  });

  return (
    <div className="space-y-6">
      {/* Student Profile & Quick Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 p-1 ring-2 ring-white/20 backdrop-blur-sm shrink-0">
              <img
                src={currentStudent.email.includes('arun') 
                  ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
                  : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                alt={currentStudent.fullName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Portal • 3rd Year (Section A)
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentStudent.fullName}
              </h1>
              <p className="text-blue-200 text-xs mt-1">
                Roll No: <span className="font-mono font-bold text-white">{currentStudent.rollNumber}</span> • Reg: <span className="font-mono text-white">{currentStudent.regNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('calculator')}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              What-If Calculator
            </button>
            <button
              onClick={onOpenLeaveModal}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-blue-300" />
              Apply for Leave
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Metric Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Attendance Percentage Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Overall Attendance
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {currentStudent.riskLevel}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {currentStudent.attendancePercentage}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({currentStudent.presentClasses} of {currentStudent.totalClasses} classes)
              </span>
            </div>

            {/* Visual Progress Bar with Threshold Markers */}
            <div className="mt-4 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStudent.attendancePercentage >= 80
                      ? 'bg-emerald-500'
                      : currentStudent.attendancePercentage >= 75
                      ? 'bg-amber-500'
                      : currentStudent.attendancePercentage >= 65
                      ? 'bg-orange-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, currentStudent.attendancePercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                <span>0%</span>
                <span className="text-orange-600 font-bold">65% (Risk)</span>
                <span className="text-amber-600 font-bold">75% (Min)</span>
                <span className="text-emerald-600 font-bold">80% (Safe)</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Dynamic Recovery Math Indicator */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            {currentStudent.attendancePercentage < 75 ? (
              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Target: 75% Mandatory Minimum
                </div>
                <p className="text-[11px] text-orange-800 leading-relaxed">
                  Attend the next <strong className="text-orange-950 font-extrabold">{classesNeeded75} consecutive classes</strong> without missing any to restore eligibility.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Attendance in Good Standing
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  You can miss up to <strong className="text-emerald-950 font-extrabold">{canMiss75} classes</strong> and still remain safely above 75%.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI & Smart Advice Insight Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 rounded-3xl border border-indigo-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Smart Recommendation & Insights</h3>
                <p className="text-xs text-slate-500">Automated evaluation generated by attendance engine</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-indigo-100/80 shadow-xs text-xs text-slate-700 leading-relaxed space-y-2">
              <p className="font-medium text-slate-800">{smartAdvice}</p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-[11px] text-slate-500">
                <span>Classes to reach 80% Safe zone: <strong className="text-indigo-600 font-bold">+{classesNeeded80} classes</strong></span>
                <span>Consecutive Absences allowed: <strong className="text-slate-800 font-bold">{canMiss75} classes</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Curious how future absences or upcoming classes impact your grade?
            </p>
            <button
              onClick={() => onNavigate('calculator')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            >
              Open What-If Simulator <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Subject-Wise Attendance Breakdown</h3>
            <p className="text-xs text-slate-500">Semester 5 Enrolled Courses</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Department of CSE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Conducted</th>
                <th className="py-3 px-4">Attended</th>
                <th className="py-3 px-4">Absent</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectBreakdown.map((sub) => {
                const subPct = sub.percentage;
                const isSafe = subPct >= 80;
                const isWarning = subPct >= 75 && subPct < 80;
                const isRisk = subPct < 75;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{sub.name}</span>
                      <span className="block text-[11px] font-mono text-slate-400">{sub.code}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{sub.total}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{sub.present}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">{sub.absent}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{subPct}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              isSafe ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${subPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isSafe
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isWarning
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isSafe ? 'Safe' : isWarning ? 'Warning' : 'At Risk'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Recent Absences & Leave Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absence History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recorded Absence Logs</h3>
                <p className="text-xs text-slate-500">Days you missed sessions</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-rose-600">{myAbsences.length} recent</span>
          </div>

          <div className="space-y-2.5">
            {myAbsences.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No absences recorded recently. Keep up the perfect streak!
              </div>
            ) : (
              myAbsences.map((ab) => (
                <div
                  key={ab.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{ab.subjectName || ab.subjectCode}</span>
                    <span className="block text-[11px] text-slate-400">{ab.date} • {ab.timeSlot}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Absent
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{ab.remarks || 'Unexcused'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Leave Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">My Leave Applications</h3>
                <p className="text-xs text-slate-500">Status of submitted leave requests</p>
              </div>
            </div>
            <button
              onClick={onOpenLeaveModal}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              + New Leave
            </button>
          </div>

          <div className="space-y-3">
            {myLeaves.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No leave applications submitted yet.
              </div>
            ) : (
              myLeaves.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{l.reasonType}</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        l.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : l.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{l.description}</p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Dates: {l.startDate} to {l.endDate}</span>
                    {l.reviewedBy && <span>Reviewed by {l.reviewedBy}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
