import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Mail,
  Send,
  MessageSquare,
  Clock,
  Layers,
  ExternalLink,
  Code2,
  Terminal,
  Shield,
  Save,
} from 'lucide-react';
import { N8nWebhookLog, SystemSettings } from '../../types';

interface N8nAutomationCenterProps {
  settings: SystemSettings;
  logs: N8nWebhookLog[];
  onUpdateSettings: (settings: SystemSettings) => void;
  onTriggerTestWebhook: (event: string, payload: any) => Promise<void>;
}

export const N8nAutomationCenter: React.FC<N8nAutomationCenterProps> = ({
  settings,
  logs,
  onUpdateSettings,
  onTriggerTestWebhook,
}) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'logs' | 'config'>('workflows');
  const [testingWorkflowId, setTestingWorkflowId] = useState<string | null>(null);
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<N8nWebhookLog | null>(null);

  // Configuration form state
  const [webhookUrl, setWebhookUrl] = useState<string>(settings.n8nWebhookUrl);
  const [webhookSecret, setWebhookSecret] = useState<string>(settings.n8nWebhookSecret);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(settings.emailAlertsEnabled);
  const [telegramAlerts, setTelegramAlerts] = useState<boolean>(settings.telegramAlertsEnabled);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const workflows = [
    {
      id: 'wf-1',
      event: 'LOW_ATTENDANCE_ALERT',
      name: '1. Low Attendance Alert (< 75%)',
      trigger: 'Attendance Recorded Event',
      channels: ['Email', 'In-App'],
      description: 'Triggered when a student drops below the 75% examination eligibility mark. Dispatches formal alerts to student and academic mentor.',
      steps: ['Attendance Marked', 'Filter: Attendance < 75%', 'Generate Recovery Targets', 'Send Student & Mentor Emails', 'Log Execution'],
      samplePayload: {
        event: 'LOW_ATTENDANCE_ALERT',
        studentName: 'Arun Kumar',
        rollNumber: 'CSE-2023-014',
        attendancePercentage: 68.4,
        classesNeededToRecover: 8,
        parentEmail: 'k.sundaram@gmail.com',
      },
    },
    {
      id: 'wf-2',
      event: 'STUDENT_ABSENT_NOTIFICATION',
      name: '2. Student Absent Notification',
      trigger: 'Batch Attendance Marked (Absent)',
      channels: ['Email', 'In-App'],
      description: 'Sends instant email notification to the student confirming unexcused absence for a specific lecture slot.',
      steps: ['Session Saved', 'Extract Absent Students', 'Format Session Metadata', 'Dispatch Student Email'],
      samplePayload: {
        event: 'STUDENT_ABSENT_NOTIFICATION',
        studentEmail: 'arun.k@student.smartattend.edu',
        subject: 'Database Management Systems (CS501)',
        date: '2026-09-27',
        timeSlot: '09:00 - 10:00 AM',
        faculty: 'Prof. Priya Sharma',
      },
    },
    {
      id: 'wf-3',
      event: 'PARENT_ABSENT_NOTIFICATION',
      name: '3. Parent Absent Notification',
      trigger: 'Daily Absence Batch',
      channels: ['Email', 'Telegram', 'SMS'],
      description: 'Alerts parents/guardians when their ward is absent during college hours to maintain parental awareness.',
      steps: ['Identify Absence', 'Lookup Parent Contact', 'Compose Ward Absence SMS/Email', 'Post via Telegram Bot'],
      samplePayload: {
        event: 'PARENT_ABSENT_NOTIFICATION',
        parentName: 'K. Sundaram',
        wardName: 'Arun Kumar',
        rollNumber: 'CSE-2023-014',
        date: '2026-09-27',
        subject: 'Database Management Systems',
      },
    },
    {
      id: 'wf-4',
      event: 'DAILY_ATTENDANCE_SUMMARY',
      name: '4. Daily Attendance Summary',
      trigger: 'Cron Schedule (17:00 Mon-Fri)',
      channels: ['Email', 'Admin Digest'],
      description: 'Compiles overall daily attendance metrics and sends high-level summary to Department HOD and Principal.',
      steps: ['Cron Trigger 5PM', 'Aggregate All Sessions', 'Count Present / Absent', 'Email HTML Digest to HOD'],
      samplePayload: {
        event: 'DAILY_ATTENDANCE_SUMMARY',
        department: 'CSE',
        date: '2026-09-27',
        totalStudents: 45,
        presentRate: '86.4%',
        defaultersCount: 3,
      },
    },
    {
      id: 'wf-5',
      event: 'WEEKLY_ATTENDANCE_REPORT',
      name: '5. Weekly Attendance Report',
      trigger: 'Cron Schedule (18:00 Friday)',
      channels: ['Email', 'CSV Export'],
      description: 'Generates weekly compliance audit, compiles CSV attachments, and sends to academic committee.',
      steps: ['Cron Friday 6PM', 'Calculate Weekly Trends', 'Generate PDF/CSV', 'Email Academic Dean'],
      samplePayload: {
        event: 'WEEKLY_ATTENDANCE_REPORT',
        weekPeriod: 'Sep 21 - Sep 27, 2026',
        cseAvg: '81.2%',
        totalClassesConducted: 42,
      },
    },
    {
      id: 'wf-6',
      event: 'LEAVE_APPROVAL_NOTIFICATION',
      name: '6. Leave Approval Notification',
      trigger: 'Faculty Action (Approved)',
      channels: ['In-App', 'Email'],
      description: 'Notifies student immediately when their leave application has been approved by faculty.',
      steps: ['Leave Marked Approved', 'Update Attendance Quota', 'Send Approval Confirmation to Student'],
      samplePayload: {
        event: 'LEAVE_APPROVAL_NOTIFICATION',
        studentName: 'Rahul Menon',
        dates: '2026-09-22 to 2026-09-23',
        status: 'Approved',
        faculty: 'Prof. Priya Sharma',
      },
    },
    {
      id: 'wf-7',
      event: 'LEAVE_REJECTION_NOTIFICATION',
      name: '7. Leave Rejection Notification',
      trigger: 'Faculty Action (Rejected)',
      channels: ['In-App', 'Email'],
      description: 'Dispatches rejection notice with reviewer remarks explaining why leave was not sanctioned.',
      steps: ['Leave Marked Rejected', 'Extract Remarks', 'Dispatch Email with Reason'],
      samplePayload: {
        event: 'LEAVE_REJECTION_NOTIFICATION',
        studentName: 'Kevin Patel',
        reason: 'Attendance below 65% critical threshold.',
        status: 'Rejected',
      },
    },
    {
      id: 'wf-8',
      event: 'CRITICAL_ATTENDANCE_ALERT',
      name: '8. Critical Attendance Alert (< 65%)',
      trigger: 'Threshold Breach (< 65%)',
      channels: ['Email', 'Telegram', 'Admin Escalation'],
      description: 'High-priority escalation when student attendance plummets below 65%. Triggers mandatory counseling alert.',
      steps: ['Attendance Evaluated < 65%', 'Flag as Debarment Risk', 'CC Dean, HOD & Parents', 'Generate Counseling Order'],
      samplePayload: {
        event: 'CRITICAL_ATTENDANCE_ALERT',
        studentName: 'Kevin Patel',
        attendancePercentage: 59.5,
        urgentActionRequired: true,
        parentPhone: '+1-555-4005',
      },
    },
  ];

  const handleTestWorkflow = async (wf: typeof workflows[0]) => {
    setTestingWorkflowId(wf.id);
    await onTriggerTestWebhook(wf.event, wf.samplePayload);
    setTestingWorkflowId(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      n8nWebhookUrl: webhookUrl,
      n8nWebhookSecret: webhookSecret,
      emailAlertsEnabled: emailAlerts,
      telegramAlertsEnabled: telegramAlerts,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30 mb-3 backdrop-blur-sm">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Workflow Orchestration Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              n8n Automation & Automated Notifications
            </h1>
            <p className="text-slate-300 text-sm max-w-xl mt-1 leading-relaxed">
              Decoupled, event-driven webhooks connecting attendance state changes to email dispatches, Telegram alerts, and admin summaries.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm p-1 rounded-2xl border border-white/15 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'workflows' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Workflows Catalog ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Execution Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'config' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Webhook Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Workflows Catalog */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf) => {
              const isTesting = testingWorkflowId === wf.id;

              return (
                <div
                  key={wf.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{wf.name}</h4>
                        <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                          {wf.trigger}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {wf.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{wf.description}</p>

                    {/* Step Flow Diagram */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        n8n Node Pipeline:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {wf.steps.map((st, i) => (
                          <React.Fragment key={st}>
                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 shadow-2xs">
                              {st}
                            </span>
                            {i < wf.steps.length - 1 && (
                              <span className="text-slate-400 font-bold">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Webhook: <code className="text-slate-600">/webhook/smartattend</code>
                    </span>

                    <button
                      onClick={() => handleTestWorkflow(wf)}
                      disabled={isTesting}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      {isTesting ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" /> Test Trigger
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Execution Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Live n8n Webhook Dispatch Telemetry</h3>
              <p className="text-xs text-slate-500">Real-time HTTP payloads and status codes</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{logs.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Target Webhook</th>
                  <th className="py-3 px-4">Response</th>
                  <th className="py-3 px-4">Execution Summary</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No webhook logs recorded yet. Click &quot;Test Trigger&quot; on any workflow to generate one!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{log.timestamp}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 font-sans">{log.event}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{log.url}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.responseCode} {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans text-xs">{log.details}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayloadLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-sans text-xs font-semibold"
                        >
                          Inspect JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Webhook Configuration Settings */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">n8n Webhook & Notification Settings</h3>
            <p className="text-xs text-slate-500">
              Configure active webhook endpoints, credentials, and notification channels.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Active n8n Webhook Target URL:
              </label>
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.yourcollege.edu/webhook/smartattend-sync"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Enter your self-hosted or cloud n8n webhook URL. Placeholder endpoints simulate execution safely.
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Webhook Shared Secret (X-SmartAttend-Secret):
              </label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="font-semibold text-slate-700 block">Notification Channels:</span>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Email SMTP Automation (Student alerts & parent notices)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramAlerts}
                  onChange={(e) => setTelegramAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Telegram Bot Integration (@smartattend_alerts)</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* JSON Payload Inspector Modal */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Payload Inspector: {selectedPayloadLog.event}</span>
              </div>
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-2xl overflow-x-auto text-[11px] font-mono text-emerald-400 max-h-96">
              {JSON.stringify(selectedPayloadLog.payload, null, 2)}
            </pre>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Timestamp: {selectedPayloadLog.timestamp}</span>
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold"
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
