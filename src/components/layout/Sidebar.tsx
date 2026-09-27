import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  AlertOctagon,
  Calculator,
  CalendarCheck,
  FileBarChart,
  BarChart3,
  Cpu,
  Bell,
  Settings,
  BookOpen,
  GraduationCap,
  History,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  pendingLeavesCount: number;
  atRiskCount: number;
  unreadNotifsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole,
  pendingLeavesCount,
  atRiskCount,
  unreadNotifsCount,
}) => {
  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
    badge?: number | string;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['admin', 'faculty', 'student', 'parent'],
    },
    {
      id: 'attendance',
      label: 'Mark Attendance',
      icon: <CheckSquare className="w-4 h-4" />,
      roles: ['admin', 'faculty'],
    },
    {
      id: 'students',
      label: 'Students Directory',
      icon: <Users className="w-4 h-4" />,
      roles: ['admin', 'faculty'],
    },
    {
      id: 'risk',
      label: 'Smart Risk Analysis',
      icon: <AlertOctagon className="w-4 h-4" />,
      roles: ['admin', 'faculty', 'student', 'parent'],
      badge: atRiskCount > 0 && (userRole === 'admin' || userRole === 'faculty') ? atRiskCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'calculator',
      label: 'Prediction / What-If',
      icon: <Calculator className="w-4 h-4" />,
      roles: ['admin', 'faculty', 'student', 'parent'],
    },
    {
      id: 'chatbot',
      label: 'Gemini AI Advisor',
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
      roles: ['admin', 'faculty', 'student', 'parent'],
      badge: 'Gemini 3',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'leaves',
      label: userRole === 'student' ? 'Apply / My Leaves' : 'Leave Requests',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['admin', 'faculty', 'student', 'parent'],
      badge: pendingLeavesCount > 0 && (userRole === 'admin' || userRole === 'faculty') ? pendingLeavesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: <FileBarChart className="w-4 h-4" />,
      roles: ['admin', 'faculty'],
    },
    {
      id: 'analytics',
      label: 'Analytics (Chart.js)',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['admin', 'faculty'],
    },
    {
      id: 'n8n',
      label: 'n8n Automation',
      icon: <Cpu className="w-4 h-4" />,
      roles: ['admin', 'faculty'],
      badge: 'Active',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: <Bell className="w-4 h-4" />,
      roles: ['admin', 'faculty', 'student', 'parent'],
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: <Settings className="w-4 h-4" />,
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 no-print">
      <div className="px-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs ring-1 ring-indigo-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* College Info & Version Card */}
      <div className="px-4 mt-6">
        <div className="p-3 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">College Internship</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Smart Student Attendance Monitoring & Automated Notification System
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>v1.0 • Express & n8n</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        </div>
      </div>
    </aside>
  );
};
