import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Shield,
  BookOpen,
  User as UserIcon,
  Users,
  ChevronDown,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { User, UserRole, NotificationItem } from '../../types';

interface NavbarProps {
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigate: (view: string) => void;
  onResetData: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchRole,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
  onResetData,
  theme,
  onToggleTheme,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roleMeta: Record<
    UserRole,
    { label: string; icon: React.ReactNode; color: string; badge: string }
  > = {
    admin: {
      label: 'Admin Portal',
      icon: <Shield className="w-3.5 h-3.5" />,
      color: 'bg-indigo-600 text-white',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    faculty: {
      label: 'Faculty Portal',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      color: 'bg-emerald-600 text-white',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    student: {
      label: 'Student Portal',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      color: 'bg-blue-600 text-white',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    parent: {
      label: 'Parent Portal',
      icon: <Users className="w-3.5 h-3.5" />,
      color: 'bg-purple-600 text-white',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-50">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">SmartAttend</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  AI & n8n
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Smart Student Attendance Monitoring & Automated Notification System
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* 1-Click Role Switcher Pill Bar for presentation ease */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <span className="px-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Demo Role:
              </span>
              {(['admin', 'faculty', 'student', 'parent'] as UserRole[]).map((r) => {
                const isActive = currentUser.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => onSwitchRole(r)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all capitalize ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs font-semibold ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {roleMeta[r].icon}
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Mobile / Compact Role Switcher */}
            <div className="relative lg:hidden">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                {roleMeta[currentUser.role].icon}
                <span className="capitalize">{currentUser.role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Demo Persona
                  </div>
                  {(['admin', 'faculty', 'student', 'parent'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onSwitchRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left capitalize ${
                        currentUser.role === r
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {roleMeta[r].icon}
                      {r} Portal
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Popover Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                aria-label="View notifications"
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h4>
                      <p className="text-[11px] text-slate-500">{unreadCount} unread system & automation alerts</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            onNavigate('notifications');
                            setShowNotifMenu(false);
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-800 line-clamp-1">{n.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {n.timestamp.split(' ')[1]?.substring(0, 5) || 'Today'}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                              {n.channel}
                            </span>
                            <span>•</span>
                            <span>{n.type}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        onNavigate('notifications');
                        setShowNotifMenu(false);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      View all in Notification Center <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-50"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.fullName}</p>
                <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-semibold capitalize ${roleMeta[currentUser.role].badge}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Global Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Quick Demo Reset Data */}
            <button
              onClick={onResetData}
              title="Reset sample database to default state"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
