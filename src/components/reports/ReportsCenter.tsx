import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Layers,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { Student, Department, Subject, AttendanceRecord } from '../../types';
import { exportToCSV, getRiskBadgeClasses } from '../../utils/calculations';

interface ReportsCenterProps {
  students: Student[];
  departments: Department[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({
  students,
  departments,
  subjects,
  attendanceRecords,
}) => {
  const [reportType, setReportType] = useState<
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'student_wise'
    | 'subject_wise'
    | 'dept_wise'
    | 'low_attendance'
    | 'absence'
  >('daily');

  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-09-20');
  const [endDate, setEndDate] = useState<string>('2026-09-27');
  const [sortField, setSortField] = useState<'name' | 'roll' | 'percentage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter students based on selection
  let reportStudents = students.filter((s) => {
    if (selectedDeptId && s.departmentId !== selectedDeptId) return false;
    if (selectedYear && s.year !== selectedYear) return false;
    if (reportType === 'low_attendance' && s.attendancePercentage >= 75) return false;

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  reportStudents.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.fullName.localeCompare(b.fullName);
    else if (sortField === 'roll') cmp = a.rollNumber.localeCompare(b.rollNumber);
    else cmp = a.attendancePercentage - b.attendancePercentage;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: 'name' | 'roll' | 'percentage') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Register Number',
      'Student Name',
      'Department',
      'Year',
      'Section',
      'Total Classes',
      'Attended Classes',
      'Absent Classes',
      'Attendance Percentage',
      'Risk Status',
      'Parent Name',
      'Parent Phone',
    ];

    const rows = reportStudents.map((s) => [
      s.rollNumber,
      s.regNumber,
      s.fullName,
      s.departmentName || 'CSE',
      s.year,
      s.section,
      s.totalClasses,
      s.presentClasses,
      s.absentClasses,
      `${s.attendancePercentage}%`,
      s.riskLevel,
      s.parentName,
      s.parentPhone,
    ]);

    exportToCSV(`SmartAttend_${reportType}_report_${new Date().toISOString().split('T')[0]}`, rows, headers);
  };

  // Metrics for report header
  const totalInReport = reportStudents.length;
  const avgPct =
    totalInReport > 0
      ? Math.round(
          (reportStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / totalInReport) * 10
        ) / 10
      : 0;
  const defaultersCount = reportStudents.filter((s) => s.attendancePercentage < 75).length;

  return (
    <div className="space-y-6">
      {/* Top Banner (hidden on print) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Reports & Academic Audit Center
            </h2>
            <p className="text-xs text-slate-500">
              Generate customizable, print-friendly, and CSV-exportable compliance reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector Pills (hidden on print) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap gap-1.5 text-xs font-semibold no-print">
        {[
          { id: 'daily', label: 'Daily Attendance Report' },
          { id: 'weekly', label: 'Weekly Summary' },
          { id: 'monthly', label: 'Monthly Report' },
          { id: 'student_wise', label: 'Student-Wise Report' },
          { id: 'subject_wise', label: 'Subject-Wise Report' },
          { id: 'dept_wise', label: 'Department-Wise Report' },
          { id: 'low_attendance', label: 'Low Attendance Defaulters (< 75%)' },
          { id: 'absence', label: 'Absence Logs Audit' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setReportType(item.id as any)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              reportType === item.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar (hidden on print) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs no-print">
        <div>
          <label className="block text-slate-500 font-semibold mb-1">Department</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Academic Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value={1}>Year 1</option>
            <option value={2}>Year 2</option>
            <option value={3}>Year 3 (Sem 5)</option>
            <option value={4}>Year 4</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Date Range</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[11px]"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[11px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Search Student</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Actual Printable Document Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Official College Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                SmartAttend AI • University Institute of Technology
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Official Attendance Compliance & Academic Audit Document
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <span className="block font-bold text-slate-800">
              Report: {reportType.toUpperCase().replace('_', ' ')}
            </span>
            <span>Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Telemetry Summary Bar */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Students Evaluated
            </span>
            <span className="text-xl font-bold text-slate-900">{totalInReport}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Average Attendance
            </span>
            <span className="text-xl font-bold text-indigo-700">{avgPct}%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Defaulters (&lt; 75%)
            </span>
            <span className="text-xl font-bold text-rose-600">{defaultersCount}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th
                  onClick={() => toggleSort('roll')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Roll No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3 text-center">Conducted</th>
                <th className="py-2.5 px-3 text-center">Present</th>
                <th className="py-2.5 px-3 text-center">Absent</th>
                <th
                  onClick={() => toggleSort('percentage')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Attendance %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Risk Tier</th>
                <th className="py-2.5 px-3">Parent Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {reportStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No student records found matching this criteria.
                  </td>
                </tr>
              ) : (
                reportStudents.map((s) => {
                  const badge = getRiskBadgeClasses(s.riskLevel);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{s.rollNumber}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                        {s.fullName}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        Yr {s.year} - {s.section}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{s.totalClasses}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                        {s.presentClasses}
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-700 font-bold">
                        {s.absentClasses}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {s.attendancePercentage}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold border ${badge.badge}`}
                        >
                          {s.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {s.parentName} ({s.parentPhone})
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signature Lines (print-ready) */}
        <div className="pt-10 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-2 font-semibold">Faculty Incharge</div>
            <span className="text-[10px] text-slate-400">Prof. Priya Sharma</span>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-semibold">Head of Department</div>
            <span className="text-[10px] text-slate-400">Dr. Ramesh Kumar</span>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-semibold">Dean Academic Affairs</div>
            <span className="text-[10px] text-slate-400">Approved & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
