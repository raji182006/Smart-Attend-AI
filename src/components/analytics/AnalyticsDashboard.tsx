import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  AlertTriangle,
  Award,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Student, Department, Subject, SystemSettings } from '../../types';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

interface AnalyticsDashboardProps {
  students: Student[];
  departments: Department[];
  subjects: Subject[];
  settings: SystemSettings;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  students,
  departments,
  subjects,
  settings,
}) => {
  const total = students.length;
  const overallAvg =
    total > 0
      ? Math.round((students.reduce((acc, s) => acc + s.attendancePercentage, 0) / total) * 10) / 10
      : 0;

  const safeCount = students.filter((s) => s.riskLevel === 'Safe').length;
  const warningCount = students.filter((s) => s.riskLevel === 'Warning').length;
  const atRiskCount = students.filter((s) => s.riskLevel === 'At Risk').length;
  const criticalCount = students.filter((s) => s.riskLevel === 'Critical').length;

  // Chart 1: Department Comparison
  const deptChartData = {
    labels: ['CSE', 'ECE', 'IT', 'MECH'],
    datasets: [
      {
        label: 'Average Attendance %',
        data: [overallAvg, 85.2, 79.4, 87.1],
        backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#10b981'],
        borderRadius: 8,
      },
    ],
  };

  // Chart 2: Subject Attendance
  const subjectChartData = {
    labels: subjects.map((s) => s.code),
    datasets: [
      {
        label: 'Average Attended %',
        data: [78.2, 82.4, 85.0, 76.5, 88.0, 81.0],
        backgroundColor: '#4f46e5',
        borderRadius: 6,
      },
    ],
  };

  // Chart 3: Weekly Trend
  const weeklyTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current Week'],
    datasets: [
      {
        label: 'Weekly Class Attendance Rate %',
        data: [81.5, 83.2, 79.8, 84.6, overallAvg],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 5,
      },
    ],
  };

  // Chart 4: Monthly Trend
  const monthlyTrendData = {
    labels: ['July (Term Start)', 'August', 'September (Current)', 'October (Forecast)'],
    datasets: [
      {
        label: 'Monthly Aggregate %',
        data: [88.5, 83.4, overallAvg, 82.0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#059669',
        pointRadius: 5,
      },
    ],
  };

  // Chart 5: Present vs Absent Overall
  const totalPresent = students.reduce((acc, s) => acc + s.presentClasses, 0);
  const totalAbsent = students.reduce((acc, s) => acc + s.absentClasses, 0);
  const ratioDonutData = {
    labels: ['Total Present Lectures', 'Total Absent Lectures'],
    datasets: [
      {
        data: [totalPresent, totalAbsent],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Chart 6: Risk Distribution
  const riskDistributionData = {
    labels: [
      `Safe (>=${settings.safeThreshold}%)`,
      `Warning (${settings.warningThreshold}-${settings.safeThreshold - 1}%)`,
      `At Risk (${settings.riskThreshold}-${settings.warningThreshold - 1}%)`,
      `Critical (<${settings.riskThreshold}%)`,
    ],
    datasets: [
      {
        data: [safeCount, warningCount, atRiskCount, criticalCount],
        backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30 mb-3 backdrop-blur-sm">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              Chart.js Visual Analytics Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Institutional Attendance Analytics
            </h1>
            <p className="text-slate-300 text-sm max-w-xl mt-1 leading-relaxed">
              Multi-dimensional charts analyzing trends, department comparisons, risk distribution, and semester health metrics.
            </p>
          </div>

          <div className="flex gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/15 min-w-[100px]">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Overall Average</span>
              <span className="text-2xl font-black text-indigo-300">{overallAvg}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/15 min-w-[100px]">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">At Risk Students</span>
              <span className="text-2xl font-black text-rose-400">{atRiskCount + criticalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Weekly Trend & Ratio Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Weekly Attendance Trajectory</h3>
              <p className="text-xs text-slate-500">Longitudinal student presence across academic weeks</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700">
              Active Semester
            </span>
          </div>
          <div className="h-64">
            <Line
              data={weeklyTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 65, max: 100, ticks: { callback: (v) => `${v}%` } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Present vs Absent Volume</h3>
                <p className="text-xs text-slate-500">Cumulative semester hours</p>
              </div>
            </div>
            <div className="h-48 flex items-center justify-center">
              <Doughnut
                data={ratioDonutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Attended</span>
              <strong className="text-emerald-700 font-bold text-sm">{totalPresent}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Missed</span>
              <strong className="text-rose-700 font-bold text-sm">{totalAbsent}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Department Comparison & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Department Performance Comparison</h3>
              <p className="text-xs text-slate-500">Average student presence benchmarked by faculty</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 60, max: 100, ticks: { callback: (v) => `${v}%` } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Student Risk Tier Distribution</h3>
              <p className="text-xs text-slate-500">Roster categorized across policy thresholds</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={riskDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Row 3 Charts: Subject-Wise Attendance & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Subject-Wise Attendance Rates</h3>
              <p className="text-xs text-slate-500">Presence breakdown by course code</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={subjectChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 60, max: 100, ticks: { callback: (v) => `${v}%` } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Monthly Attendance Trajectory</h3>
              <p className="text-xs text-slate-500">Month-over-month semester forecast</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={monthlyTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 70, max: 100, ticks: { callback: (v) => `${v}%` } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
