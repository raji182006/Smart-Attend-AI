import React, { useState } from 'react';
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  AlertCircle,
  Send,
  MessageSquare,
  User,
} from 'lucide-react';
import { LeaveRequest, UserRole, Student } from '../../types';

interface LeaveManagementProps {
  leaveRequests: LeaveRequest[];
  userRole: UserRole;
  currentStudent?: Student;
  reviewerName: string;
  onSubmitLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  onUpdateStatus: (
    leaveId: number,
    status: 'Approved' | 'Rejected',
    reviewedBy: string,
    remarks: string
  ) => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  leaveRequests,
  userRole,
  currentStudent,
  reviewerName,
  onSubmitLeave,
  onUpdateStatus,
}) => {
  const isStudent = userRole === 'student';
  const isFacultyOrAdmin = userRole === 'faculty' || userRole === 'admin';

  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'apply'>(
    isStudent ? 'apply' : 'pending'
  );

  // Form State
  const [startDate, setStartDate] = useState<string>('2026-09-30');
  const [endDate, setEndDate] = useState<string>('2026-10-01');
  const [reasonType, setReasonType] = useState<
    'Medical' | 'Family Event' | 'Academic / On Duty' | 'Emergency' | 'Other'
  >('Medical');
  const [description, setDescription] = useState<string>('');
  const [docName, setDocName] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Review Modal State
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmitLeave({
      studentId: currentStudent?.id || 1,
      studentName: currentStudent?.fullName || 'Arun Kumar',
      rollNumber: currentStudent?.rollNumber || 'CSE-2023-014',
      startDate,
      endDate,
      reasonType,
      description,
      documentUrl: docName || undefined,
    });

    setDescription('');
    setDocName('');
    setFormSuccess('Leave application successfully submitted! Faculty advisor has been notified via n8n.');
    setTimeout(() => {
      setFormSuccess(null);
      setActiveTab('all');
    }, 2500);
  };

  const handleConfirmReview = () => {
    if (!selectedLeaveForReview) return;
    onUpdateStatus(selectedLeaveForReview.id, reviewAction, reviewerName, reviewRemarks);
    setSelectedLeaveForReview(null);
    setReviewRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management System</h2>
            <p className="text-xs text-slate-500">
              Submit, review, and track student leave requests with automated n8n notifications.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
          {isFacultyOrAdmin && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Review ({pendingLeaves.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'apply'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Apply for Leave
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            All Leaves History
          </button>
        </div>
      </div>

      {/* Form Submission Success Alert */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Tab 1: Apply for Leave */}
      {activeTab === 'apply' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">New Leave Application</h3>
            <p className="text-xs text-slate-500">
              Submit your absence request for academic faculty sanction.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Leave Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Leave End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Reason Category *</label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Medical">Medical (Health / Doctor Prescription)</option>
                <option value="Academic / On Duty">Academic / On Duty (Hackathon, Conference, Sports)</option>
                <option value="Family Event">Family Event (Wedding, Personal Occasion)</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Detailed Explanation *</label>
              <textarea
                required
                rows={3}
                placeholder="State the reason clearly for your class advisor's review..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Supporting Document (Optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. medical_certificate_dr_sharma.pdf"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setDocName('medical_certificate_prescribed.pdf')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold whitespace-nowrap flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Sample Doc
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Pending Approvals (Faculty / Admin) */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">All caught up!</p>
              <p>No student leave applications are currently awaiting review.</p>
            </div>
          ) : (
            pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{l.studentName}</span>
                    <span className="font-mono text-slate-500">({l.rollNumber})</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                      {l.reasonType}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{l.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>
                      Duration: <strong>{l.startDate}</strong> to <strong>{l.endDate}</strong>
                    </span>
                    {l.documentUrl && (
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {l.documentUrl}
                      </span>
                    )}
                    <span>Applied: {l.appliedAt.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedLeaveForReview(l);
                      setReviewAction('Rejected');
                      setReviewRemarks('Leave rejected due to low attendance threshold.');
                    }}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeaveForReview(l);
                      setReviewAction('Approved');
                      setReviewRemarks('Leave sanctioned. Submit required coursework upon return.');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: All Leaves History */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Leave Applications Registry</h3>
            <span className="text-xs text-slate-400">{leaveRequests.length} total entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reason Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {l.studentName}
                      <span className="block text-[11px] font-mono text-slate-400">{l.rollNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {l.startDate} <span className="text-slate-400">to</span> {l.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{l.reasonType}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">{l.description}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          l.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : l.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {l.reviewRemarks ? (
                        <span>
                          {l.reviewRemarks} <strong className="text-slate-700 block">({l.reviewedBy})</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedLeaveForReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Confirm Leave {reviewAction}: {selectedLeaveForReview.studentName}
              </h3>
              <button
                onClick={() => setSelectedLeaveForReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-semibold text-slate-700">Dates:</span>{' '}
                {selectedLeaveForReview.startDate} to {selectedLeaveForReview.endDate}
                <br />
                <span className="font-semibold text-slate-700">Reason:</span>{' '}
                {selectedLeaveForReview.description}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Review Remarks / Instructions for Student:
                </label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedLeaveForReview(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className={`px-5 py-2 text-white rounded-xl font-bold transition-all shadow-xs ${
                  reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {reviewAction} & Trigger n8n
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
