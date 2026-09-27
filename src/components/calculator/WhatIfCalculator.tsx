import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Student } from '../../types';
import {
  calculateAttendancePercentage,
  calculateProjectedAttendance,
  getRiskBadgeClasses,
  getRiskLevel,
  calculateClassesNeeded,
  calculateClassesCanMiss,
} from '../../utils/calculations';

interface WhatIfCalculatorProps {
  students: Student[];
  currentStudent?: Student;
}

export const WhatIfCalculator: React.FC<WhatIfCalculatorProps> = ({
  students,
  currentStudent,
}) => {
  // Initial values from student or fallback to Arun Kumar's realistic scenario
  const defaultStudent = currentStudent || students.find((s) => s.id === 1) || students[0];

  const [selectedStudentId, setSelectedStudentId] = useState<number>(defaultStudent?.id || 1);
  const [currentTotal, setCurrentTotal] = useState<number>(defaultStudent?.totalClasses || 38);
  const [currentPresent, setCurrentPresent] = useState<number>(defaultStudent?.presentClasses || 26);
  const [upcomingClasses, setUpcomingClasses] = useState<number>(10);
  const [expectedPresent, setExpectedPresent] = useState<number>(10);
  const [missNextCount, setMissNextCount] = useState<number>(2);

  // Sync when picking student
  const handleStudentSelect = (id: number) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      setCurrentTotal(stu.totalClasses);
      setCurrentPresent(stu.presentClasses);
      setUpcomingClasses(10);
      setExpectedPresent(10);
    }
  };

  // Calculations
  const currentPercentage = calculateAttendancePercentage(currentPresent, currentTotal);
  const currentRisk = getRiskLevel(currentPercentage);
  const currentBadge = getRiskBadgeClasses(currentRisk);

  const projection = calculateProjectedAttendance(
    currentPresent,
    currentTotal,
    upcomingClasses,
    expectedPresent
  );
  const projectedBadge = getRiskBadgeClasses(projection.projectedRiskLevel);

  // What happens if I miss next N classes simulation
  const missSimTotal = currentTotal + missNextCount;
  const missSimPresent = currentPresent; // attended zero of the next N classes
  const missSimPct = calculateAttendancePercentage(missSimPresent, missSimTotal);
  const missSimRisk = getRiskLevel(missSimPct);
  const missSimBadge = getRiskBadgeClasses(missSimRisk);
  const missDrop = Math.round((currentPercentage - missSimPct) * 10) / 10;

  // Recovery math
  const classesNeeded75 = calculateClassesNeeded(currentPresent, currentTotal, 75);
  const classesNeeded80 = calculateClassesNeeded(currentPresent, currentTotal, 80);
  const canMiss75 = calculateClassesCanMiss(currentPresent, currentTotal, 75);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Smart Attendance Prediction Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Attendance &quot;What-If&quot; Simulator
            </h1>
            <p className="text-blue-200 text-sm max-w-xl mt-1 leading-relaxed">
              Test future attendance scenarios, forecast semester eligibility, and evaluate the risk of missing upcoming lectures.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/15 text-xs">
            <label className="block text-blue-300 font-semibold mb-1">Load Student Profile:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(Number(e.target.value))}
              className="bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-1.5 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.rollNumber}) — {s.attendancePercentage}% [{s.riskLevel}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Dual Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Inputs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Scenario Parameters</h3>
                <p className="text-xs text-slate-500">Adjust attendance inputs to simulate projections</p>
              </div>
            </div>
            <button
              onClick={() => {
                setUpcomingClasses(10);
                setExpectedPresent(10);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Current Baseline Stats */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Current Academic Status
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Total Classes Conducted</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={currentTotal}
                  onChange={(e) => setCurrentTotal(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Classes Present (Attended)</label>
                <input
                  type="number"
                  min={0}
                  max={currentTotal}
                  value={currentPresent}
                  onChange={(e) =>
                    setCurrentPresent(Math.min(currentTotal, Math.max(0, Number(e.target.value))))
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600">Current Attendance:</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base">{currentPercentage}%</span>
                <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${currentBadge.badge}`}>
                  {currentRisk}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Future Projections Input */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Future Lecture Forecast
            </span>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Number of Upcoming Classes Scheduled:</span>
                <span className="text-indigo-600 font-bold">{upcomingClasses} classes</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={upcomingClasses}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setUpcomingClasses(val);
                  if (expectedPresent > val) setExpectedPresent(val);
                }}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 class</span>
                <span>25 classes</span>
                <span>50 classes</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Expected Classes You Will Attend:</span>
                <span className="text-emerald-600 font-bold">{expectedPresent} classes</span>
              </div>
              <input
                type="range"
                min={0}
                max={upcomingClasses}
                value={expectedPresent}
                onChange={(e) => setExpectedPresent(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (Miss all)</span>
                <span>{Math.round(upcomingClasses / 2)} (Half)</span>
                <span>{upcomingClasses} (100% Attendance)</span>
              </div>
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setExpectedPresent(upcomingClasses)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors"
            >
              Attend 100% of upcoming
            </button>
            <button
              onClick={() => setExpectedPresent(Math.floor(upcomingClasses * 0.75))}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-semibold hover:bg-amber-100 transition-colors"
            >
              Attend 75% of upcoming
            </button>
            <button
              onClick={() => setExpectedPresent(0)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 transition-colors"
            >
              Miss all upcoming
            </button>
          </div>
        </div>

        {/* Right Column: Projected Results & Impact Analysis */}
        <div className="space-y-6">
          {/* Main Projected Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 rounded-3xl p-6 border border-indigo-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900/60">
                Forecasted Outcome
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${projectedBadge.badge}`}
              >
                <span className={`w-2 h-2 rounded-full ${projectedBadge.dot}`} />
                Projected: {projection.projectedRiskLevel}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black text-slate-900 tracking-tight">
                {projection.projectedPercentage}%
              </span>
              <div>
                <span
                  className={`inline-flex items-center gap-0.5 text-sm font-bold ${
                    projection.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {projection.difference >= 0 ? `+${projection.difference}%` : `${projection.difference}%`}
                </span>
                <span className="block text-[11px] text-slate-400">from current baseline</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span>New Total Classes:</span>
                <strong>{projection.projectedTotal}</strong>
              </div>
              <div className="flex justify-between">
                <span>New Total Present:</span>
                <strong className="text-emerald-700">{projection.projectedPresent}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Missed:</span>
                <strong className="text-rose-700">{projection.projectedTotal - projection.projectedPresent}</strong>
              </div>
            </div>

            {/* Status change indicator */}
            <div className="p-3 rounded-2xl bg-indigo-600/5 border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Status shifts from <strong className="capitalize">{currentRisk}</strong> to{' '}
                <strong className="capitalize text-indigo-700">{projection.projectedRiskLevel}</strong>.
              </span>
            </div>
          </div>

          {/* Secondary Simulation: "What happens if I miss the next N classes?" */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    &quot;What happens if I miss upcoming classes?&quot;
                  </h4>
                  <p className="text-[11px] text-slate-500">Consecutive absence penalty calculator</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">If I miss the next:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMissNextCount(n)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      missNextCount === n
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span className="text-slate-400 font-medium">classes</span>
              </div>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-600 font-medium block">
                  Projected Attendance if you miss {missNextCount} class{missNextCount > 1 ? 'es' : ''}:
                </span>
                <span className="text-2xl font-black text-rose-700">{missSimPct}%</span>
                <span className="text-rose-600 text-[11px] font-semibold block">
                  (-{missDrop}% penalty)
                </span>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${missSimBadge.badge}`}>
                  {missSimRisk}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                  {missSimPresent}/{missSimTotal} classes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formula & Viva Reference Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Internship Mathematical Reference: Attendance Recovery & What-If Equations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-[11px]">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Projected Attendance:</span>
            <code>Projected % = ((P_current + P_expected) / (T_current + T_upcoming)) * 100</code>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Classes Required to Reach Target R%:</span>
            <code>Classes Needed = ceil((R * T_current - P_current) / (1 - R))</code>
          </div>
        </div>
      </div>
    </div>
  );
};
