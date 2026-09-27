import React, { useState, useMemo } from 'react';
import {
  Department,
  Subject,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  SystemSettings,
  FacultyMember,
} from '../../types';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Cpu,
  History,
  Info,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { calculateAttendancePercentage, getRiskBadgeClasses } from '../../utils/calculations';

interface AttendanceMarkerProps {
  departments: Department[];
  subjects: Subject[];
  students: Student[];
  facultyList: FacultyMember[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  currentFacultyId?: number;
  initialSubjectId?: number;
  onSaveAttendance: (
    records: Omit<AttendanceRecord, 'id' | 'createdAt'>[],
    triggerN8n: boolean
  ) => void;
}

export const AttendanceMarker: React.FC<AttendanceMarkerProps> = ({
  departments,
  subjects,
  students,
  facultyList,
  attendanceRecords,
  settings,
  currentFacultyId = 1,
  initialSubjectId,
  onSaveAttendance,
}) => {
  // Selector state
  const [selectedDeptId, setSelectedDeptId] = useState<number>(departments[0]?.id || 1);
  const [selectedYear, setSelectedYear] = useState<number>(3);
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(
    initialSubjectId || subjects[0]?.id || 1
  );
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-27');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:00 - 10:00 AM');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [triggerN8nWebhook, setTriggerN8nWebhook] = useState<boolean>(true);
  const [viewHistoryModal, setViewHistoryModal] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Available subjects for selected department
  const filteredSubjects = subjects.filter((s) => s.departmentId === selectedDeptId);

  // Filter students by Dept, Year, Section
  const targetStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.departmentId === selectedDeptId &&
        s.year === selectedYear &&
        s.section === selectedSection
    );
  }, [students, selectedDeptId, selectedYear, selectedSection]);

  // Check if attendance already recorded for this exact combo (duplicate prevention)
  const existingSessionRecords = useMemo(() => {
    return attendanceRecords.filter(
      (r) =>
        r.subjectId === selectedSubjectId &&
        r.date === selectedDate &&
        r.timeSlot === selectedSlot
    );
  }, [attendanceRecords, selectedSubjectId, selectedDate, selectedSlot]);

  const isDuplicateSession = existingSessionRecords.length > 0;

  // Local student attendance map: studentId -> { status, remarks }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<number, { status: AttendanceStatus; remarks: string }>
  >(() => {
    const initial: Record<number, { status: AttendanceStatus; remarks: string }> = {};
    targetStudents.forEach((s) => {
      initial[s.id] = { status: 'Present', remarks: '' };
    });
    return initial;
  });

  // Re-sync attendance map when session or target students change
  React.useEffect(() => {
    const updated: Record<number, { status: AttendanceStatus; remarks: string }> = {};
    targetStudents.forEach((s) => {
      const existing = existingSessionRecords.find((r) => r.studentId === s.id);
      if (existing) {
        updated[s.id] = { status: existing.status, remarks: existing.remarks || '' };
      } else {
        updated[s.id] = { status: 'Present', remarks: '' };
      }
    });
    setAttendanceMap(updated);
  }, [selectedSubjectId, selectedDate, selectedSlot, selectedDeptId, selectedYear, selectedSection]);

  // Filtered by student name or roll/reg number search
  const displayedStudents = targetStudents.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.regNumber.toLowerCase().includes(q)
    );
  });

  // Fast Bulk Actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...attendanceMap };
    targetStudents.forEach((s) => {
      updated[s.id] = { ...updated[s.id], status };
    });
    setAttendanceMap(updated);
  };

  const handleToggleStudent = (studentId: number, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Tallies
  const currentPresentCount = targetStudents.filter(
    (s) => (attendanceMap[s.id]?.status || 'Present') === 'Present'
  ).length;
  const currentAbsentCount = targetStudents.filter(
    (s) => attendanceMap[s.id]?.status === 'Absent'
  ).length;
  const currentSessionPct = calculateAttendancePercentage(
    currentPresentCount,
    targetStudents.length
  );

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Submit Handler
  const handleSaveAttendance = () => {
    const recordsToSave: Omit<AttendanceRecord, 'id' | 'createdAt'>[] = targetStudents.map(
      (s) => {
        const entry = attendanceMap[s.id] || { status: 'Present', remarks: '' };
        return {
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.rollNumber,
          subjectId: selectedSubjectId,
          subjectCode: selectedSubject?.code || 'SUBJ',
          subjectName: selectedSubject?.name || 'Class',
          facultyId: currentFacultyId,
          date: selectedDate,
          timeSlot: selectedSlot,
          status: entry.status,
          remarks: entry.remarks,
        };
      }
    );

    onSaveAttendance(recordsToSave, triggerN8nWebhook);
    setSaveSuccessMessage(
      `Successfully recorded attendance for ${recordsToSave.length} students (${currentPresentCount} Present, ${currentAbsentCount} Absent). ${
        triggerN8nWebhook ? 'Automated n8n webhook notifications dispatched.' : ''
      }`
    );
    setTimeout(() => setSaveSuccessMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Attendance Register & Marking Console
              </h2>
              <p className="text-xs text-slate-500">
                Select class criteria, review student roster, mark attendance, and trigger automated n8n workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewHistoryModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <History className="w-4 h-4 text-slate-400" />
            Past Sessions History
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Duplicate Session Notice */}
      {isDuplicateSession && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">
              Duplicate Attendance Check: Attendance already recorded for this slot
            </span>
            <p className="text-amber-800 text-[11px] mt-0.5">
              Records exist for <strong>{selectedSubject?.name}</strong> on{' '}
              <strong>{selectedDate}</strong> ({selectedSlot}). You are currently in{' '}
              <strong>Edit Mode</strong>. Saving will update the existing session rather than creating duplicates.
            </p>
          </div>
        </div>
      )}

      {/* Class & Subject Selector Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. Department */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">1. Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Year */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">2. Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1st Year (Sem 1/2)</option>
              <option value={2}>2nd Year (Sem 3/4)</option>
              <option value={3}>3rd Year (Sem 5/6)</option>
              <option value={4}>4th Year (Sem 7/8)</option>
            </select>
          </div>

          {/* 3. Section */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">3. Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* 4. Subject */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">4. Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Date */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">5. Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 6. Time Slot */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">6. Time Slot</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="09:00 - 10:00 AM">09:00 - 10:00 AM</option>
              <option value="10:00 - 11:00 AM">10:00 - 11:00 AM</option>
              <option value="11:15 - 12:15 PM">11:15 - 12:15 PM</option>
              <option value="01:15 - 02:15 PM">01:15 - 02:15 PM</option>
              <option value="02:15 - 03:15 PM">02:15 - 03:15 PM</option>
              <option value="03:30 - 04:30 PM">03:30 - 04:30 PM</option>
            </select>
          </div>
        </div>

        {/* Live Session Telemetry Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-600">
              Students Roster: <strong className="text-slate-900">{targetStudents.length}</strong>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
              Present: {currentPresentCount}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold border border-rose-200">
              Absent: {currentAbsentCount}
            </span>
            <span className="text-indigo-700 font-bold">
              Session Rate: {currentSessionPct}%
            </span>
          </div>

          {/* Quick Mark All Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('Present')}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Select All Present
            </button>
            <button
              onClick={() => handleMarkAll('Absent')}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Select All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student List Table & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={triggerN8nWebhook}
                onChange={(e) => setTriggerN8nWebhook(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                Dispatch via n8n Webhook
              </span>
            </label>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Roll / Reg Number</th>
                <th className="py-3 px-4">Cumulative Attendance</th>
                <th className="py-3 px-4 text-center">Mark Status</th>
                <th className="py-3 px-4">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students match the criteria for Year {selectedYear}, Section {selectedSection}.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s, index) => {
                  const entry = attendanceMap[s.id] || { status: 'Present', remarks: '' };
                  const isPresent = entry.status === 'Present';
                  const isAbsent = entry.status === 'Absent';
                  const isOnLeave = entry.status === 'On Leave';
                  const badge = getRiskBadgeClasses(s.riskLevel);

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isAbsent ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 text-sm">{s.fullName}</span>
                        <span className="block text-[11px] text-slate-400">
                          Parent: {s.parentName} ({s.parentPhone})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <span className="font-bold text-slate-800">{s.rollNumber}</span>
                        <span className="block text-[10px] text-slate-400">{s.regNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{s.attendancePercentage}%</span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.badge}`}>
                            {s.riskLevel}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {s.presentClasses}/{s.totalClasses} attended
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(s.id, 'Present')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 shadow-2xs ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(s.id, 'Absent')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 shadow-2xs ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-rose-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(s.id, 'On Leave')}
                            className={`px-2.5 py-1.5 rounded-xl font-medium transition-all text-xs flex items-center gap-1 ${
                              isOnLeave
                                ? 'bg-amber-600 text-white shadow-amber-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder={isAbsent ? 'e.g. Uninformed absence' : 'Note...'}
                          value={entry.remarks}
                          onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Submit Attendance Actions Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              Saving will calculate running attendance percentages and forward absent alerts to{' '}
              <strong className="text-slate-700">n8n webhooks</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleMarkAll('Present')}
              className="w-1/2 sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSaveAttendance}
              className="w-1/2 sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Attendance ({currentPresentCount} Present)
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Recorded Sessions History</h3>
                    <p className="text-xs text-slate-500">Log of recorded attendance sessions in system</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto max-h-96 divide-y divide-slate-100">
                {attendanceRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No records found.</p>
                ) : (
                  attendanceRecords.slice(0, 15).map((r) => (
                    <div key={r.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{r.studentName}</span>
                        <span className="block text-[11px] text-slate-400">
                          {r.subjectName || r.subjectCode} • {r.date} ({r.timeSlot})
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            r.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="block text-[10px] text-slate-400">{r.facultyName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
