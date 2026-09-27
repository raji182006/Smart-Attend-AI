import React from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  MessageSquare,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { Student, AttendanceRecord, NotificationItem, FacultyMember } from '../../types';
import { getRiskBadgeClasses } from '../../utils/calculations';

interface ParentDashboardProps {
  ward: Student;
  advisor: FacultyMember;
  attendanceRecords: AttendanceRecord[];
  notifications: NotificationItem[];
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  ward,
  advisor,
  attendanceRecords,
  notifications,
}) => {
  const badge = getRiskBadgeClasses(ward.riskLevel);
  const wardAbsences = attendanceRecords.filter(
    (r) => r.studentId === ward.id && r.status === 'Absent'
  );
  const parentNotifs = notifications.filter(
    (n) => n.recipientRole === 'parent' || n.recipientRole === 'all' || n.studentId === ward.id
  );

  const isAtRisk = ward.riskLevel === 'At Risk' || ward.riskLevel === 'Critical';

  return (
    <div className="space-y-6">
      {/* Parent Portal Header */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/30 mb-3 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5" />
              Parent Portal • Academic Ward Telemetry
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Parent Dashboard
            </h1>
            <p className="text-purple-100 text-sm max-w-xl mt-1 leading-relaxed">
              Monitoring attendance records and official academic communications for ward:{' '}
              <strong className="text-white font-bold">{ward.fullName}</strong>.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/15 text-xs text-purple-200">
            <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Enrolled Program
            </span>
            <span className="text-white font-semibold">B.Tech Computer Science (Year 3)</span>
            <span className="block font-mono text-purple-300 text-[11px] mt-0.5">
              Roll No: {ward.rollNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning Alert if Applicable */}
      {isAtRisk && (
        <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 text-rose-900">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-rose-800">
              Attendance Alert: Ward Is Below Required College Minimum
            </h4>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {ward.fullName}&apos;s cumulative attendance is currently{' '}
              <strong>{ward.attendancePercentage}%</strong>, which is below the mandatory university threshold of 75%. Please discuss regular attendance with your ward and consult the faculty advisor if there are health or personal concerns.
            </p>
          </div>
        </div>
      )}

      {/* Main Ward Attendance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ward Attendance Rate
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {ward.riskLevel}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900">{ward.attendancePercentage}%</span>
              <span className="text-xs text-slate-500 font-medium">overall</span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Classes Attended</span>
                <strong className="text-emerald-700">{ward.presentClasses}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Classes Missed</span>
                <strong className="text-rose-700">{ward.absentClasses}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Total Conducted</span>
                <strong className="text-slate-800">{ward.totalClasses}</strong>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block text-center">
              Next term exam eligibility cutoff: <strong>75.0%</strong>
            </span>
          </div>
        </div>

        {/* Faculty Advisor Contact Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Class Faculty Advisor
            </span>

            <div className="mt-4 flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
                alt={advisor.fullName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-50"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900">{advisor.fullName}</h4>
                <p className="text-xs text-slate-500">{advisor.designation}</p>
                <span className="text-[10px] text-indigo-600 font-semibold">{advisor.departmentName}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-[11px] text-slate-700">{advisor.email}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-[11px] text-slate-700">+1-555-2001 (Ext: 402)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <a
              href={`mailto:${advisor.email}?subject=Attendance%20Query%20for%20${ward.fullName}`}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send Email to Advisor
            </a>
          </div>
        </div>

        {/* Telegram / Email Automated Alerts Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Automated Notification Channel
            </span>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs">
                <div className="flex items-center justify-between font-semibold text-purple-900 mb-1">
                  <span>Registered Contact</span>
                  <span className="text-[10px] bg-purple-200/60 px-1.5 py-0.5 rounded text-purple-800">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-purple-700">{ward.parentEmail}</p>
                <p className="text-[11px] text-purple-700 font-mono mt-0.5">{ward.parentPhone}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Instant Absence SMS</span>
                  <strong className="text-emerald-600">Enabled</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Telegram Bot Alerts</span>
                  <strong className="text-emerald-600">Enabled</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Weekly Summary Digest</span>
                  <strong className="text-indigo-600">Fridays 18:00</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-400 text-center">
            Powered by n8n Automated Webhook Services
          </div>
        </div>
      </div>

      {/* Two Column Section: Absence Timeline & Recent Automated Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absence Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Absence Notifications</h3>
              <p className="text-xs text-slate-500">Record of lectures where ward was marked absent</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {wardAbsences.length} Total
            </span>
          </div>

          <div className="space-y-3">
            {wardAbsences.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No absences recorded for your ward!
              </div>
            ) : (
              wardAbsences.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-800">{rec.subjectName || rec.subjectCode}</h5>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Date: <strong>{rec.date}</strong> • Slot: {rec.timeSlot}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px]">
                    Absent
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices & Communications from College */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Official Notices & Circulars</h3>
              <p className="text-xs text-slate-500">Communications dispatched via automated notification system</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Department of CSE</span>
          </div>

          <div className="space-y-3">
            {parentNotifs.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{n.title}</span>
                  <span className="text-[10px] text-slate-400">{n.timestamp.split(' ')[0]}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                    {n.channel}
                  </span>
                  <span>• Status: {n.deliveryStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
