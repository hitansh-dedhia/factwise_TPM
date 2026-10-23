import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Users,
  DoorOpen,
  Thermometer,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { getMetrics } from '../lib/db';
import { MORTALITY_BENCHMARK, SUCCESS_BENCHMARK } from '../lib/constants';

export const DashboardScreen: React.FC = () => {
  const { dataVersion, appDate } = useAppData();
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    return getMetrics();
  }, [dataVersion, appDate]);

  const isMortalityCritical = metrics.mortalityRate > MORTALITY_BENCHMARK;
  const isSuccessOnTarget = metrics.successRate >= SUCCESS_BENCHMARK;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 m-0">
            <LayoutDashboard size={22} className="text-teal-400" />
            <span>Clinical & Operational Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time viral quarantine surveillance, clinical throughput, and benchmark compliance
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            Reporting Date: <strong className="text-teal-300">{appDate}</strong>
          </span>
        </div>
      </div>

      {/* MORTALITY BENCHMARK ALERT BANNER (Prominent warning when mortality > 15%) */}
      {isMortalityCritical ? (
        <div className="bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl p-5 text-rose-200 shadow-xl shadow-rose-950/40 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500 text-slate-950">
                  Critical Alert
                </span>
                <h2 className="text-base font-bold text-white m-0">
                  Mortality Rate ({metrics.mortalityRate.toFixed(1)}%) Exceeds 15% Maximum Benchmark
                </h2>
              </div>
              <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed">
                Facility closed case mortality currently stands at{' '}
                <strong className="text-white font-mono">{metrics.mortalityRate.toFixed(1)}%</strong> ({metrics.deceased} deceased out of {metrics.closed} closed cases), which violates the target ceiling of {MORTALITY_BENCHMARK}%. Immediate clinical review and protocol auditing required.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-emerald-200">
                Mortality Metric Within Safe Operational Threshold
              </span>
              <p className="text-[11px] text-emerald-400/80">
                Current mortality rate of {metrics.mortalityRate.toFixed(1)}% is within the target ceiling of {MORTALITY_BENCHMARK}%.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
            {metrics.mortalityRate.toFixed(1)}% ≤ 15%
          </span>
        </div>
      )}

      {/* KPI Cards: Section 8 Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Rooms */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <DoorOpen size={13} className="text-slate-500" /> Total Beds
          </span>
          <span className="text-2xl font-bold text-slate-100 font-mono block">
            {metrics.totalRooms}
          </span>
          <span className="text-[10px] text-slate-500">Max Facility Capacity</span>
        </div>

        {/* Occupied */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Users size={13} className="text-teal-400" /> Active Patients
          </span>
          <span className="text-2xl font-bold text-teal-400 font-mono block">
            {metrics.activePatients}
          </span>
          <span className="text-[10px] text-slate-500">{metrics.free} Beds Available</span>
        </div>

        {/* Closed Cases */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-blue-400" /> Closed Cases
          </span>
          <span className="text-2xl font-bold text-blue-400 font-mono block">
            {metrics.closed}
          </span>
          <span className="text-[10px] text-slate-500">Discharged + Deceased</span>
        </div>

        {/* Discharged Cured */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-400" /> Discharged
          </span>
          <span className="text-2xl font-bold text-emerald-400 font-mono block">
            {metrics.discharged}
          </span>
          <span className="text-[10px] text-emerald-500/80">Full Viral Clearance</span>
        </div>

        {/* Deceased */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <TrendingDown size={13} className="text-rose-400" /> Deceased
          </span>
          <span className="text-2xl font-bold text-rose-400 font-mono block">
            {metrics.deceased}
          </span>
          <span className="text-[10px] text-rose-500/80">Mortality Count</span>
        </div>

        {/* Success Rate */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" /> Success Rate
          </span>
          <span
            className={`text-2xl font-bold font-mono block ${
              isSuccessOnTarget ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {metrics.successRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500">Target ≥ {SUCCESS_BENCHMARK}%</span>
        </div>
      </div>

      {/* Daily Progress Surveillance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Thermometer size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white m-0">Today's Temperature Coverage</h3>
                <span className="text-[11px] text-slate-400">Nursing daily thermal measurement queue</span>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-teal-400">
              {metrics.measuredToday} / {metrics.activePatients}
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-500 rounded-full"
                style={{
                  width: `${
                    metrics.activePatients > 0
                      ? (metrics.measuredToday / metrics.activePatients) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{metrics.activePatients - metrics.measuredToday} unmeasured patients remaining</span>
              <span>
                {metrics.activePatients > 0
                  ? ((metrics.measuredToday / metrics.activePatients) * 100).toFixed(0)
                  : 0}
                % Complete
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Visit Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Stethoscope size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white m-0">Today's Doctor Visits</h3>
                <span className="text-[11px] text-slate-400">Physician consultation coverage</span>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-blue-400">
              {metrics.visitedToday} / {metrics.measuredToday}
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                style={{
                  width: `${
                    metrics.measuredToday > 0
                      ? (metrics.visitedToday / metrics.measuredToday) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>
                {Math.max(0, metrics.measuredToday - metrics.visitedToday)} measured awaiting doctor
              </span>
              <span>
                {metrics.measuredToday > 0
                  ? ((metrics.visitedToday / metrics.measuredToday) * 100).toFixed(0)
                  : 0}
                % Visited
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discharge Pipeline Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ready for Discharge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Ready for Discharge</span>
              <span className="text-[11px] text-slate-400">
                {metrics.readyForDischarge} patients auto-flagged after 3 fever-free days
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/discharge')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Review Queue</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Discharge Confirmed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Discharge Confirmed</span>
              <span className="text-[11px] text-slate-400">
                {metrics.dischargeConfirmed} patients cleared by doctor awaiting room release
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/discharge')}
            className="px-3.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Process Release</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
