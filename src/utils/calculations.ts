import { RiskLevel, SystemSettings } from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  safeThreshold: 80,
  warningThreshold: 75,
  riskThreshold: 65,
  criticalThreshold: 65,
  n8nWebhookUrl: 'https://n8n.yourcollege.edu/webhook/smartattend-sync',
  n8nWebhookSecret: 'n8n_sec_tk_smartattend_2026',
  emailAlertsEnabled: true,
  telegramAlertsEnabled: true,
  telegramBotToken: '719283749:AAGxY-938kLm1pZ290-qK',
  telegramChatId: '@smartattend_alerts',
};

/**
 * Calculates attendance percentage: (Present / Total) * 100
 */
export function calculateAttendancePercentage(present: number, total: number): number {
  if (total <= 0) return 100;
  const pct = (present / total) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Determines risk level based on configurable thresholds:
 * 80% and above -> Safe
 * 75% - 79.9% -> Warning
 * 65% - 74.9% -> At Risk
 * Below 65% -> Critical
 */
export function getRiskLevel(
  percentage: number,
  settings: Partial<SystemSettings> = DEFAULT_SETTINGS
): RiskLevel {
  const safe = settings.safeThreshold ?? 80;
  const warning = settings.warningThreshold ?? 75;
  const risk = settings.riskThreshold ?? 65;

  if (percentage >= safe) return 'Safe';
  if (percentage >= warning) return 'Warning';
  if (percentage >= risk) return 'At Risk';
  return 'Critical';
}

export function getRiskBadgeClasses(level: RiskLevel): {
  badge: string;
  dot: string;
  text: string;
  bgLight: string;
  border: string;
} {
  switch (level) {
    case 'Safe':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-200',
      };
    case 'Warning':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        bgLight: 'bg-amber-50',
        border: 'border-amber-200',
      };
    case 'At Risk':
      return {
        badge: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10',
        dot: 'bg-orange-500',
        text: 'text-orange-700',
        bgLight: 'bg-orange-50',
        border: 'border-orange-200',
      };
    case 'Critical':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
        dot: 'bg-rose-500',
        text: 'text-rose-700',
        bgLight: 'bg-rose-50',
        border: 'border-rose-200',
      };
  }
}

/**
 * Calculates number of consecutive classes required to reach target percentage:
 * (Present + x) / (Total + x) >= Target
 * x * (1 - Target) >= Target * Total - Present
 * x = ceil((Target * Total - Present) / (1 - Target))
 */
export function calculateClassesNeeded(
  present: number,
  total: number,
  targetPercentage: number = 75
): number {
  if (total <= 0) return 0;
  const currentPct = (present / total) * 100;
  if (currentPct >= targetPercentage) return 0;

  const targetRatio = targetPercentage / 100;
  if (targetRatio >= 1) return 0;

  const needed = Math.ceil((targetRatio * total - present) / (1 - targetRatio));
  return Math.max(0, needed);
}

/**
 * Calculates how many consecutive classes can be missed before falling below target:
 * Present / (Total + y) >= Target
 * y = floor((Present - Target * Total) / Target)
 */
export function calculateClassesCanMiss(
  present: number,
  total: number,
  targetPercentage: number = 75
): number {
  if (total <= 0) return 0;
  const currentPct = (present / total) * 100;
  if (currentPct < targetPercentage) return 0;

  const targetRatio = targetPercentage / 100;
  if (targetRatio <= 0) return 0;

  const canMiss = Math.floor((present - targetRatio * total) / targetRatio);
  return Math.max(0, canMiss);
}

/**
 * Attendance What-If Projected Percentage:
 * (Current Present + Expected Present) / (Current Total + Upcoming Classes) * 100
 */
export function calculateProjectedAttendance(
  currentPresent: number,
  currentTotal: number,
  upcomingClasses: number,
  expectedPresent: number
): {
  projectedPercentage: number;
  difference: number;
  projectedTotal: number;
  projectedPresent: number;
  projectedRiskLevel: RiskLevel;
} {
  const projectedTotal = Math.max(1, currentTotal + upcomingClasses);
  const projectedPresent = Math.min(projectedTotal, currentPresent + expectedPresent);
  const currentPercentage = calculateAttendancePercentage(currentPresent, currentTotal);
  const projectedPercentage = calculateAttendancePercentage(projectedPresent, projectedTotal);
  const difference = Math.round((projectedPercentage - currentPercentage) * 10) / 10;
  const projectedRiskLevel = getRiskLevel(projectedPercentage);

  return {
    projectedPercentage,
    difference,
    projectedTotal,
    projectedPresent,
    projectedRiskLevel,
  };
}

/**
 * Generates smart objective recommendations based on attendance data
 */
export function generateSmartRecommendation(
  studentName: string,
  percentage: number,
  classesNeeded75: number,
  classesNeeded80: number,
  canMiss75: number
): string {
  if (percentage >= 80) {
    if (canMiss75 > 2) {
      return `Outstanding attendance record. You can safely miss up to ${canMiss75} classes while remaining strictly above the mandatory 75% college norm.`;
    }
    return `Excellent consistency! Maintain regular presence to comfortably stay in the Safe bracket throughout the term.`;
  }

  if (percentage >= 75) {
    return `Currently in Warning zone (${percentage}%). Attending the next ${classesNeeded80} consecutive sessions will elevate your record into the Safe (80%+) tier. Avoid unexcused leaves.`;
  }

  if (percentage >= 65) {
    return `At Risk alert! Must attend the next ${classesNeeded75} upcoming classes without absence to regain the 75% semester exam eligibility threshold.`;
  }

  return `Critical deficit alert! Immediate faculty mentor intervention advised. Attend all upcoming ${classesNeeded75} classes and submit legitimate medical or approved leave documentation.`;
}

/**
 * Exports data to browser CSV download
 */
export function exportToCSV(filename: string, rows: (string | number)[][], headers: string[]): void {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        let stringVal = val === null || val === undefined ? '' : String(val);
        if (stringVal.search(/("|,|\n)/g) >= 0) {
          stringVal = `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      })
      .join(',');
  };

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map(processRow)].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
