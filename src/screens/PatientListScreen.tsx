import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Thermometer,
  Stethoscope,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { getActivePatientsEnriched, statusLabel, processFinalDischargeOp } from '../lib/db';
import type { PatientWithDailyStatus } from '../lib/types';
import { hasPermission } from '../lib/permissions';

export const PatientListScreen: React.FC = () => {
  const { user } = useAuth();
  const { appDate, dataVersion, triggerRefresh } = useAppData();
  const navigate = useNavigate();

  // Determine initial filter tab per role
  const initialFilter = useMemo(() => {
    if (user?.role === 'NURSE') return 'NOT_MEASURED';
    if (user?.role === 'DOCTOR') return 'MEASURED_AWAITING_DOCTOR';
    return 'ALL';
  }, [user?.role]);

  const [activeTab, setActiveTab] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch enriched patients reactively
  const patients = useMemo(() => {
    // depend on dataVersion and appDate
    return getActivePatientsEnriched();
  }, [dataVersion, appDate]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: patients.length,
      notMeasured: patients.filter((p) => p.dailyTaskStatus === 'NOT_MEASURED').length,
      awaitingDoctor: patients.filter(
        (p) => p.dailyTaskStatus === 'MEASURED_AWAITING_DOCTOR'
      ).length,
      visited: patients.filter((p) => p.dailyTaskStatus === 'VISITED').length,
    };
  }, [patients]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    let list = patients;

    // Filter by tab
    if (activeTab === 'NOT_MEASURED') {
      list = list.filter((p) => p.dailyTaskStatus === 'NOT_MEASURED');
    } else if (activeTab === 'MEASURED_AWAITING_DOCTOR') {
      list = list.filter((p) => p.dailyTaskStatus === 'MEASURED_AWAITING_DOCTOR');
    } else if (activeTab === 'VISITED') {
      list = list.filter((p) => p.dailyTaskStatus === 'VISITED');
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.roomNumber.toString().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    // Sort by room number ascending
    return list.sort((a, b) => a.roomNumber - b.roomNumber);
  }, [patients, activeTab, searchQuery]);

  // Calculate days admitted from appDate
  const getDaysAdmitted = (admittedAt: string) => {
    const adm = new Date(admittedAt.split('T')[0] + 'T00:00:00');
    const cur = new Date(appDate + 'T00:00:00');
    const diffTime = cur.getTime() - adm.getTime();
    const days = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
    return days;
  };

  const handleAdminDischarge = (e: React.MouseEvent, patient: PatientWithDailyStatus) => {
    e.stopPropagation();
    if (!user) return;
    try {
      processFinalDischargeOp({
        patientId: patient.id,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });
      triggerRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 m-0">
            <span>Active Patients</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
              {patients.length} admitted
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time daily monitoring and workflow queues for 74 facility rooms
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or room..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'ALL'
              ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>All Active</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'ALL' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('NOT_MEASURED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'NOT_MEASURED'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>Not Measured Today</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'NOT_MEASURED'
                ? 'bg-slate-950/20 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {counts.notMeasured}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MEASURED_AWAITING_DOCTOR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'MEASURED_AWAITING_DOCTOR'
              ? 'bg-blue-500 text-slate-950 font-semibold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>Measured, Awaiting Doctor</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'MEASURED_AWAITING_DOCTOR'
                ? 'bg-slate-950/20 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {counts.awaitingDoctor}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VISITED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'VISITED'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>Visited Today</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'VISITED'
                ? 'bg-slate-950/20 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {counts.visited}
          </span>
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Stay</th>
                <th className="py-3 px-4">Fever-Free</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Today's Task</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No active patients match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const daysAdmitted = getDaysAdmitted(p.admittedAt);
                  const canNurseRecord =
                    hasPermission(user?.role, 'record_temperature') &&
                    p.dailyTaskStatus === 'NOT_MEASURED';
                  const canDoctorFallback =
                    hasPermission(user?.role, 'record_temperature_fallback') &&
                    p.dailyTaskStatus === 'NOT_MEASURED';
                  const canDoctorVisit =
                    hasPermission(user?.role, 'log_visit') &&
                    p.dailyTaskStatus === 'MEASURED_AWAITING_DOCTOR';
                  const canAdminDischarge =
                    hasPermission(user?.role, 'process_discharge') &&
                    p.status === 'DISCHARGE_CONFIRMED';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Room */}
                      <td className="py-3 px-4 font-mono">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-teal-400 font-bold border border-slate-700/80 group-hover:border-teal-500/40">
                          {p.roomNumber}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-teal-300 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {p.id}
                        </div>
                      </td>

                      {/* Demographics */}
                      <td className="py-3 px-4 text-slate-400">
                        {p.age}y • {p.gender === 'MALE' ? 'M' : p.gender === 'FEMALE' ? 'F' : 'O'}
                      </td>

                      {/* Stay */}
                      <td className="py-3 px-4 text-slate-400">
                        Day {daysAdmitted}
                      </td>

                      {/* Fever-Free Days */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((step) => (
                              <span
                                key={step}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  p.feverFreeDays >= step
                                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                                    : 'bg-slate-800 border border-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {p.feverFreeDays}/3
                          </span>
                          {p.feverFreeDays === 3 && (
                            <Sparkles size={12} className="text-amber-400 animate-pulse" />
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            p.status === 'READY_FOR_DISCHARGE'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : p.status === 'DISCHARGE_CONFIRMED'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {statusLabel(p.status)}
                        </span>
                      </td>

                      {/* Today's Task Status */}
                      <td className="py-3 px-4">
                        {p.dailyTaskStatus === 'NOT_MEASURED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Not measured
                          </span>
                        )}
                        {p.dailyTaskStatus === 'MEASURED_AWAITING_DOCTOR' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {p.todaysReading?.valueCelsius}°C • Awaiting Dr
                          </span>
                        )}
                        {p.dailyTaskStatus === 'VISITED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Visited ({p.todaysReading?.valueCelsius}°C)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Temp action for Nurse or Doctor fallback */}
                          {(user?.role === 'NURSE' || user?.role === 'DOCTOR') && (
                            <button
                              type="button"
                              disabled={!canNurseRecord && !canDoctorFallback}
                              onClick={() => navigate(`/patients/${p.id}/record-temp`)}
                              title={
                                !canNurseRecord && !canDoctorFallback
                                  ? `Temperature already recorded today (${p.todaysReading?.valueCelsius}°C)`
                                  : 'Record temperature'
                              }
                              className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                                canNurseRecord || canDoctorFallback
                                  ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                                  : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800'
                              }`}
                            >
                              <Thermometer size={14} />
                              <span className="hidden md:inline">Record Temp</span>
                            </button>
                          )}

                          {/* Log Visit action for Doctor */}
                          {user?.role === 'DOCTOR' && (
                            <button
                              type="button"
                              disabled={!canDoctorVisit}
                              onClick={() => navigate(`/patients/${p.id}/log-visit`)}
                              title={
                                p.dailyTaskStatus === 'NOT_MEASURED'
                                  ? "Cannot log visit until temperature is taken"
                                  : p.dailyTaskStatus === 'VISITED'
                                  ? 'Visit already logged today'
                                  : 'Log Doctor Visit'
                              }
                              className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                                canDoctorVisit
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                                  : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800'
                              }`}
                            >
                              <Stethoscope size={14} />
                              <span className="hidden md:inline">Log Visit</span>
                            </button>
                          )}

                          {/* Final Discharge for Admin */}
                          {canAdminDischarge && (
                            <button
                              type="button"
                              onClick={(e) => handleAdminDischarge(e, p)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
                            >
                              Process Discharge
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/patients/${p.id}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
