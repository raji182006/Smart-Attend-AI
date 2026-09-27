import React, { useState } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Filter,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Student, Department, UserRole } from '../../types';
import { getRiskBadgeClasses } from '../../utils/calculations';

interface StudentsListProps {
  students: Student[];
  departments: Department[];
  userRole: UserRole;
  onAddStudent: (
    studentData: Omit<
      Student,
      | 'id'
      | 'userId'
      | 'totalClasses'
      | 'presentClasses'
      | 'absentClasses'
      | 'attendancePercentage'
      | 'riskLevel'
      | 'trend'
    >
  ) => void;
  onTriggerN8nAlert: (student: Student) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({
  students,
  departments,
  userRole,
  onAddStudent,
  onTriggerN8nAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<number>(0);
  const [yearFilter, setYearFilter] = useState<number>(0);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [viewStudentModal, setViewStudentModal] = useState<Student | null>(null);

  // New Student Form State
  const [fullName, setFullName] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [regNumber, setRegNumber] = useState<string>('');
  const [deptId, setDeptId] = useState<number>(1);
  const [year, setYear] = useState<number>(3);
  const [section, setSection] = useState<string>('A');
  const [semester, setSemester] = useState<number>(5);
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('+1-555-3099');
  const [parentName, setParentName] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('+1-555-4099');

  const filtered = students.filter((s) => {
    if (deptFilter !== 0 && s.departmentId !== deptFilter) return false;
    if (yearFilter !== 0 && s.year !== yearFilter) return false;
    if (riskFilter !== 'all' && s.riskLevel !== riskFilter) return false;

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.regNumber.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === deptId);
    onAddStudent({
      fullName,
      rollNumber,
      regNumber,
      departmentId: deptId,
      departmentName: dept?.name || 'Computer Science',
      year,
      section,
      semester,
      email: email || `${rollNumber.toLowerCase().replace('-', '_')}@student.smartattend.edu`,
      phone,
      parentName,
      parentEmail,
      parentPhone,
    });

    setShowAddModal(false);
    // Reset form
    setFullName('');
    setRollNumber('');
    setRegNumber('');
    setParentName('');
    setParentEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Students Directory</h2>
            <p className="text-xs text-slate-500">
              Manage student profiles, academic rosters, parent details, and telemetry status.
            </p>
          </div>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Student
          </button>
        )}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, roll, reg, parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
          >
            <option value={0}>All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
          >
            <option value={0}>All Academic Years</option>
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year (Sem 5)</option>
            <option value={4}>4th Year</option>
          </select>
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
          >
            <option value="all">All Risk Tiers</option>
            <option value="Safe">Safe (&ge; 80%)</option>
            <option value="Warning">Warning (75%–79%)</option>
            <option value="At Risk">At Risk (65%–74%)</option>
            <option value="Critical">Critical (&lt; 65%)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll & Register No</th>
                <th className="py-3 px-4">Academic Group</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const badge = getRiskBadgeClasses(s.riskLevel);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.fullName}
                        <span className="block text-[11px] text-slate-400 font-normal">{s.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-800">{s.rollNumber}</span>
                        <span className="block text-[10px] text-slate-400">{s.regNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">
                          {s.departmentName?.split(' ')[0]}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Yr {s.year} • Sec {s.section}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="text-sm">{s.attendancePercentage}%</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {s.presentClasses}/{s.totalClasses} classes
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {s.riskLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-semibold">{s.parentName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {s.parentPhone}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewStudentModal(s)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onTriggerN8nAlert(s)}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                            title="Trigger n8n Notification"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enroll New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Varun Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="CSE-2023-055"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Register Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="710023104055"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department *</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester</label>
                  <input
                    type="number"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block mb-2">Parent / Guardian Information:</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Parent Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S. Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Parent Email</label>
                    <input
                      type="email"
                      placeholder="parent@gmail.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Parent Phone</label>
                    <input
                      type="text"
                      placeholder="+1-555-4099"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student View Modal */}
      {viewStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {viewStudentModal.fullName.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{viewStudentModal.fullName}</h3>
                  <span className="font-mono text-xs text-slate-400">{viewStudentModal.rollNumber}</span>
                </div>
              </div>
              <button onClick={() => setViewStudentModal(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <span className="font-semibold text-slate-800">{viewStudentModal.departmentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Year / Section</span>
                  <span className="font-semibold text-slate-800">
                    Year {viewStudentModal.year} • Sec {viewStudentModal.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Attendance %</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {viewStudentModal.attendancePercentage}% ({viewStudentModal.presentClasses}/{viewStudentModal.totalClasses})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Risk Tier</span>
                  <span className="font-bold text-slate-800">{viewStudentModal.riskLevel}</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-950 block">Parent / Guardian Contact:</span>
                <p className="text-indigo-900">Name: {viewStudentModal.parentName}</p>
                <p className="text-indigo-900 font-mono">Email: {viewStudentModal.parentEmail}</p>
                <p className="text-indigo-900 font-mono">Phone: {viewStudentModal.parentPhone}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  onTriggerN8nAlert(viewStudentModal);
                  setViewStudentModal(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Cpu className="w-3.5 h-3.5" />
                Dispatch n8n Alert
              </button>
              <button
                onClick={() => setViewStudentModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
