import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  BookOpen,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Cpu,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { signInWithGoogle } from '../../services/firebase';

interface LoginViewProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, availableUsers }) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      const res = await signInWithGoogle(selectedRole);
      onLogin({
        id: Math.floor(Math.random() * 9000) + 1000,
        username: res.email?.split('@')[0] || 'google_user',
        email: res.email || 'user@smartattend.edu',
        fullName: res.displayName || 'Google User',
        role: res.role || selectedRole,
        avatar: res.photoURL || undefined,
      });
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      setErrorMessage(`Google Sign-In: ${err.message || 'Authentication was cancelled or unavailable.'}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const demoAccounts: {
    role: UserRole;
    username: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      role: 'admin',
      username: 'admin',
      label: 'Admin Portal',
      description: 'System metrics, n8n monitoring & settings',
      icon: <Shield className="w-4 h-4 text-indigo-500" />,
    },
    {
      role: 'faculty',
      username: 'prof_sharma',
      label: 'Faculty Portal',
      description: 'Mark attendance & review leave requests',
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    },
    {
      role: 'student',
      username: 'arun_k',
      label: 'Student Portal',
      description: 'Attendance history & what-if calculator',
      icon: <GraduationCap className="w-4 h-4 text-blue-500" />,
    },
    {
      role: 'parent',
      username: 'arun_parent',
      label: 'Parent Portal',
      description: 'Ward telemetry & absence alerts',
      icon: <Users className="w-4 h-4 text-purple-500" />,
    },
  ];

  const handleQuickFill = (acc: typeof demoAccounts[0]) => {
    setSelectedRole(acc.role);
    setUsername(acc.username);
    setPassword('password123');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    // Match with available user or craft authenticated user
    const matched = availableUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.role === selectedRole
    );

    if (matched) {
      onLogin(matched);
    } else {
      // Fallback
      onLogin({
        id: 99,
        username,
        email: `${username}@smartattend.edu`,
        fullName: username,
        role: selectedRole,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        {/* Brand Icon */}
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-500/20 ring-4 ring-white/10">
          <GraduationCap className="w-9 h-9" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SmartAttend AI</h1>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mt-1">
            Smart Student Attendance Monitoring & Automated Notification System
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20 space-y-6">
          {/* Quick 1-Click Role Switcher */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Demo Persona (1-Click Fill):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {demoAccounts.map((acc) => {
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    type="button"
                    key={acc.role}
                    onClick={() => handleQuickFill(acc)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      {acc.icon}
                      <span className="capitalize">{acc.role}</span>
                    </div>
                    <span className="block text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {acc.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secure Firebase Google Sign-In */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2.5 hover:border-slate-400 group disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.13C3.25 21.31 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.69 1.27 6.59l4.01 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : `Sign in with Google (${selectedRole.toUpperCase()})`}</span>
            </button>
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Or with credentials</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Username / Identifier</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <span>Enter SmartAttend AI Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>

          {/* Internship Project Footer Badge */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" /> n8n Automation Ready
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> MySQL 8.0 DDL Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
