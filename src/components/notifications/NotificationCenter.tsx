import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  MessageSquare,
  Search,
  Filter,
  CheckCheck,
  Cpu,
  Clock,
  Layers,
} from 'lucide-react';
import { NotificationItem, UserRole } from '../../types';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  userRole: UserRole;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  userRole,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = notifications.filter((n) => {
    if (filterType === 'unread' && n.isRead) return false;
    if (filterType === 'alerts' && !n.type.includes('Alert')) return false;
    if (filterType === 'absent' && !n.type.includes('Absent')) return false;
    if (filterType === 'leave' && !n.type.includes('Leave')) return false;

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.studentName?.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
            <p className="text-xs text-slate-500">
              Audit log of automated alerts, email dispatches, Telegram broadcasts, and academic notices.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notification messages, students, types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 font-semibold">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'alerts', label: 'Threshold Alerts' },
            { id: 'absent', label: 'Absence Notices' },
            { id: 'leave', label: 'Leave Updates' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterType === item.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No notifications found</p>
            <p>You are completely caught up with all attendance communications.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const isAlert = n.type.includes('Alert') || n.type.includes('Critical');
            const isAbsent = n.type.includes('Absent');

            return (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                  !n.isRead
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{n.title}</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                        isAlert
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isAbsent
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {n.type}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                      {n.channel}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed">{n.message}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Timestamp: {n.timestamp}</span>
                    {n.studentName && (
                      <span>
                        Student: <strong className="text-slate-700">{n.studentName}</strong>
                      </span>
                    )}
                    <span className="text-emerald-600 font-medium">
                      Status: {n.deliveryStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead ? (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold shadow-2xs"
                    >
                      Mark Read
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
