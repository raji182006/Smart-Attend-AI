import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Search,
  CheckCircle2,
  Info,
  Filter,
  Sparkles,
  Send,
} from 'lucide-react';
import { Student, SystemSettings, RiskLevel } from '../../types';
import {
  calculateClassesNeeded,
  calculateClassesCanMiss,
  getRiskBadgeClasses,
  generateSmartRecommendation,
} from '../../utils/calculations';

interface SmartRiskAnalysisProps {
  students: Student[];
  settings: SystemSettings;
  onTriggerN8nAlert: (student: Student) => void;
}

export const SmartRiskAnalysis: React.FC<SmartRiskAnalysisProps> = ({
  students,
  settings,
  onTriggerN8nAlert,
}) => {
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);

  // Group counts
  const safeCount = students.filter((s) => s.riskLevel === 'Safe').length;
  const warningCount = students.filter((s) => s.riskLevel === 'Warning').length;
  const atRiskCount = students.filter((s) => s.riskLevel === 'At Risk').length;
  const criticalCount = students.filter((s) => s.riskLevel === 'Critical').length;

  const filteredStudents = students.filter((s) => {
    const matchesRisk = filterRisk === 'All' || s.riskLevel === filterRisk;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q);
    return matchesRisk && matchesSearch;
  });

  const handleSendAlert = (student: Student) => {
    onTriggerN8nAlert(student);
    setAlertSuccessToast(
      `Dispatched automated Low Attendance Alert via n8n to ${student.fullName} and parent ${student.parentName} (${student.parentEmail}).`
    );
    setTimeout(() => setAlertSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold border border-orange-400/30 mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Smart Attendance Intelligence Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Attendance Risk Analysis & Early Intervention
            </h1>
            <p className="text-slate-300 text-sm max-w-xl mt-1 leading-relaxed">
              Automated telemetry detects students slipping toward examination debarment and computes mathematically exact recovery targets.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 text-xs text-slate-300 max-w-xs">
            <span className="font-bold text-white block mb-1">Configured Policy Norms:</span>
            <span>Safe: &ge; {settings.safeThreshold}% • Warning: {settings.warningThreshold}% - {settings.safeThreshold - 0.1}% • Risk: {settings.riskThreshold}% - {settings.warningThreshold - 0.1}%</span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {alertSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{alertSuccessToast}</span>
          </div>
          <button
            onClick={() => setAlertSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Risk Tier Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Safe */}
        <div
          onClick={() => setFilterRisk('Safe')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterRisk === 'Safe'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800">Safe Tier (&ge;{settings.safeThreshold}%)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-700">{safeCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Students in good standing</span>
          </div>
        </div>

        {/* Warning */}
        <div
          onClick={() => setFilterRisk('Warning')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterRisk === 'Warning'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-800">
              Warning ({settings.warningThreshold}%–{settings.safeThreshold - 1}%)
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-700">{warningCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Close to border</span>
          </div>
        </div>

        {/* At Risk */}
        <div
          onClick={() => setFilterRisk('At Risk')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterRisk === 'At Risk'
              ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-orange-800">
              At Risk ({settings.riskThreshold}%–{settings.warningThreshold - 1}%)
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-orange-700">{atRiskCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Requires recovery</span>
          </div>
        </div>

        {/* Critical */}
        <div
          onClick={() => setFilterRisk('Critical')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterRisk === 'Critical'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-200 shadow-sm'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-800">Critical (&lt;{settings.riskThreshold}%)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-700">{criticalCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Immediate intervention</span>
          </div>
        </div>
      </div>

      {/* Main Student Risk Analysis Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterRisk('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterRisk === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Tiers ({students.length})
            </button>
            <button
              onClick={() => setFilterRisk('At Risk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterRisk === 'At Risk'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              Defaulters Only ({atRiskCount + criticalCount})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Trend</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4">Recovery Targets</th>
                <th className="py-3 px-4 min-w-[280px]">Smart Recommendation</th>
                <th className="py-3 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const badge = getRiskBadgeClasses(s.riskLevel);
                  const classesNeeded75 = calculateClassesNeeded(
                    s.presentClasses,
                    s.totalClasses,
                    75
                  );
                  const classesNeeded80 = calculateClassesNeeded(
                    s.presentClasses,
                    s.totalClasses,
                    80
                  );
                  const canMiss75 = calculateClassesCanMiss(s.presentClasses, s.totalClasses, 75);
                  const recommendation = generateSmartRecommendation(
                    s.fullName,
                    s.attendancePercentage,
                    classesNeeded75,
                    classesNeeded80,
                    canMiss75
                  );

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.fullName}
                        <span className="block text-[11px] font-mono text-slate-400">
                          {s.rollNumber} • {s.departmentName?.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="text-sm">{s.attendancePercentage}%</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {s.presentClasses}/{s.totalClasses} classes
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.trend === 'improving' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <TrendingUp className="w-3 h-3" /> Improving
                          </span>
                        ) : s.trend === 'declining' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            <TrendingDown className="w-3 h-3" /> Declining
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Minus className="w-3 h-3" /> Stable
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {s.riskLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {s.attendancePercentage < 75 ? (
                          <div className="space-y-0.5">
                            <span className="text-orange-700 font-bold block text-[11px]">
                              +{classesNeeded75} for 75%
                            </span>
                            <span className="text-indigo-600 font-medium block text-[10px]">
                              +{classesNeeded80} for 80%
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 font-semibold block text-[11px]">
                              Can miss {canMiss75} class{canMiss75 > 1 ? 'es' : ''}
                            </span>
                            <span className="text-slate-400 block text-[10px]">Safely &ge; 75%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-relaxed">
                        {recommendation}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleSendAlert(s)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs whitespace-nowrap"
                        >
                          <Cpu className="w-3 h-3 text-indigo-500" />
                          Notify via n8n
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

      {/* Academic Integrity & Disclaimer Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-500">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong>Academic Estimation Notice:</strong> Recommendations and projected recovery class counts are computed objectively from past recorded lectures. They do not constitute a formal medical or academic guarantee.
        </p>
      </div>
    </div>
  );
};
