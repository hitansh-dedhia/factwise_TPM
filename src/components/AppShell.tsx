import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  LayoutDashboard,
  UserPlus,
  DoorOpen,
  ClipboardList,
  LogOut,
  Calendar,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ROLE_LABELS, ROLE_COLORS, hasPermission } from '../lib/permissions';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { appDate, simulateNextDay, resetDemoData } = useAppData();
  const navigate = useNavigate();

  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSimulateNextDay = () => {
    simulateNextDay();
    showToast('Simulated Next Day! App date advanced by 1 day.');
  };

  const handleConfirmReset = async () => {
    await resetDemoData();
    setShowResetModal(false);
    showToast('Demo data reset! Seed data restored to initial state.');
  };

  if (!user) return null;

  // Build navigation items based strictly on role permissions
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: hasPermission(user.role, 'view_dashboard'),
    },
    {
      to: '/patients',
      label: 'Patients',
      icon: Users,
      visible: hasPermission(user.role, 'view_patient_list'),
    },
    {
      to: '/admit',
      label: 'Admit Patient',
      icon: UserPlus,
      visible: hasPermission(user.role, 'admit_patient'),
    },
    {
      to: '/discharge',
      label: 'Discharge Queue',
      icon: CheckCircle2,
      visible: hasPermission(user.role, 'view_discharge_queue'),
    },
    {
      to: '/rooms',
      label: 'Room Occupancy',
      icon: DoorOpen,
      visible: hasPermission(user.role, 'view_room_occupancy'),
    },
    {
      to: '/audit',
      label: 'Audit Log',
      icon: ClipboardList,
      visible: hasPermission(user.role, 'view_audit_log'),
    },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <Activity size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Reset Demo Data */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Reset Demo Data?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This will erase any modifications made during this demo and re-seed all 70 active patients, 22 closed cases, and restore the initial app date.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition cursor-pointer shadow-lg shadow-amber-600/30"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">ViralTrack</span>
              <span className="text-[10px] text-slate-400 block font-mono">74-Bed Facility</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
            Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Demo Tools Section */}
          <div className="pt-5 mt-4 border-t border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 py-1 flex items-center gap-1.5">
              <span>DEMO TOOLS</span>
            </div>
            <div className="space-y-1.5 mt-1">
              <button
                type="button"
                onClick={handleSimulateNextDay}
                title="Advance app date by 1 calendar day to test 3-day fever-free discharge logic"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition cursor-pointer"
              >
                <FastForward size={14} className="text-teal-400" />
                <span>Simulate Next Day</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                title="Restore fresh seed dataset (70 active, 22 closed cases)"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-800 hover:text-amber-400 border border-slate-700/60 transition cursor-pointer"
              >
                <RotateCcw size={14} className="text-amber-400" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex flex-col truncate pr-2">
              <span className="text-xs font-semibold text-slate-200 truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">@{user.userId}</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                ROLE_COLORS[user.role]
              }`}
            >
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-medium border border-slate-700/60 hover:border-rose-500/40 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Strip */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-slate-200"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">Facility Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Monitoring
              </span>
            </div>
          </div>

          {/* Current App Date Pill (R29) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200">
              <Calendar size={13} className="text-teal-400" />
              <span className="text-[11px] text-slate-400 font-mono">App Date:</span>
              <span className="font-semibold text-teal-300 font-mono">{appDate}</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
