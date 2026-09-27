import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Percent,
  Cpu,
  Mail,
  Send,
  Database,
  Save,
  CheckCircle2,
  RotateCcw,
  KeyRound,
  Info,
} from 'lucide-react';
import { SystemSettings } from '../../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetDatabase,
}) => {
  const [safeThreshold, setSafeThreshold] = useState<number>(settings.safeThreshold);
  const [warningThreshold, setWarningThreshold] = useState<number>(settings.warningThreshold);
  const [riskThreshold, setRiskThreshold] = useState<number>(settings.riskThreshold);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState<string>(settings.n8nWebhookUrl);
  const [n8nWebhookSecret, setN8nWebhookSecret] = useState<string>(settings.n8nWebhookSecret);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(settings.emailAlertsEnabled);
  const [telegramAlertsEnabled, setTelegramAlertsEnabled] = useState<boolean>(
    settings.telegramAlertsEnabled
  );
  const [telegramBotToken, setTelegramBotToken] = useState<string>(settings.telegramBotToken || '');
  const [telegramChatId, setTelegramChatId] = useState<string>(settings.telegramChatId || '');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      safeThreshold,
      warningThreshold,
      riskThreshold,
      criticalThreshold: riskThreshold,
      n8nWebhookUrl,
      n8nWebhookSecret,
      emailAlertsEnabled,
      telegramAlertsEnabled,
      telegramBotToken,
      telegramChatId,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & Policies</h2>
            <p className="text-xs text-slate-500">
              Configure attendance thresholds, n8n webhook pipelines, and notification channels.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all records back to the default demo state?')) {
              onResetDatabase();
            }
          }}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 flex items-center gap-1.5 shadow-2xs"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Demo Data
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Policy thresholds and webhook parameters updated! Student risk tiers re-evaluated.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Configurable Attendance Policy Thresholds */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Configurable Attendance Policy Norms</h3>
              <p className="text-xs text-slate-500">College academic criteria defining risk tiers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900 block">Safe Tier Threshold (&ge; %)</span>
              <p className="text-[11px] text-emerald-700">Students at or above this percentage are safe.</p>
              <input
                type="number"
                min={50}
                max={100}
                value={safeThreshold}
                onChange={(e) => setSafeThreshold(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 font-bold text-slate-900 text-base"
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 block">Warning Tier Threshold (&ge; %)</span>
              <p className="text-[11px] text-amber-700">Students receive early warnings in this bracket.</p>
              <input
                type="number"
                min={40}
                max={safeThreshold - 1}
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold text-slate-900 text-base"
              />
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-2">
              <span className="font-bold text-orange-900 block">At Risk / Debarment Tier (&ge; %)</span>
              <p className="text-[11px] text-orange-700">Below this percentage, student is in Critical status.</p>
              <input
                type="number"
                min={30}
                max={warningThreshold - 1}
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 font-bold text-slate-900 text-base"
              />
            </div>
          </div>
        </div>

        {/* Section 2: n8n Automation & Integration Credentials */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">n8n Automation Webhook & Secrets</h3>
              <p className="text-xs text-slate-500">Configure external automation services</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Active n8n Webhook Target URL:
              </label>
              <input
                type="url"
                required
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Webhook Shared Secret Key (X-SmartAttend-Secret):
              </label>
              <input
                type="text"
                value={n8nWebhookSecret}
                onChange={(e) => setN8nWebhookSecret(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Telegram Bot Token</label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Telegram Alert Channel ID</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="@smartattend_alerts"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
