import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  UserCheck,
  AlertCircle,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import {
  getActivePatients,
  confirmDischargeOp,
  processFinalDischargeOp,
} from '../lib/db';
import type { Patient } from '../lib/types';
import { hasPermission } from '../lib/permissions';

export const DischargeQueueScreen: React.FC = () => {
  const { user } = useAuth();
  const { appDate, dataVersion, triggerRefresh } = useAppData();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  const activePatients = useMemo(() => {
    return getActivePatients();
  }, [dataVersion]);

  const readyList = useMemo(() => {
    return activePatients.filter((p) => p.status === 'READY_FOR_DISCHARGE');
  }, [activePatients]);

  const confirmedList = useMemo(() => {
    return activePatients.filter((p) => p.status === 'DISCHARGE_CONFIRMED');
  }, [activePatients]);

  const getDaysAdmitted = (admittedAt: string) => {
    const adm = new Date(admittedAt.split('T')[0] + 'T00:00:00');
    const cur = new Date(appDate + 'T00:00:00');
    const diff = cur.getTime() - adm.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleConfirmDischarge = (patient: Patient) => {
    if (!user) return;
    setFeedback(null);
    try {
      confirmDischargeOp({
        patientId: patient.id,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });
      triggerRefresh();
      setFeedback({
        type: 'success',
        text: `Confirmed medical discharge for ${patient.name}. Transferred to Admin processing queue.`,
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  };

  const handleProcessDischarge = (patient: Patient) => {
    if (!user) return;
    setFeedback(null);
    try {
      processFinalDischargeOp({
        patientId: patient.id,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });
      triggerRefresh();
      setFeedback({
        type: 'success',
        text: `Successfully processed final discharge for ${patient.name}. Room ${patient.roomNumber} is now freed!`,
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', text: (err as Error).message });
    }
  };

  const canDoctorConfirm = hasPermission(user?.role, 'confirm_discharge');
  const canAdminProcess = hasPermission(user?.role, 'process_discharge');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 m-0">
          <CheckCircle2 size={24} className="text-teal-400" />
          <span>Discharge Pipeline Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Two-stage medical clearance: Doctor confirmation of 3-day fever-free cured status, followed by Admin final room release.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* SECTION A: READY FOR DISCHARGE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white m-0">
                Stage 1: Ready for Discharge (Doctor Confirmation)
              </h2>
              <p className="text-[11px] text-slate-400">
                Patients who have completed 3 consecutive fever-free days (&lt;38.0°C). Requires doctor medical clearance.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold self-start sm:self-auto font-mono">
            {readyList.length} Pending Doctor
          </span>
        </div>

        {readyList.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No patients currently in Stage 1 ready for discharge queue.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Demographics</th>
                  <th className="py-2.5 px-3">Stay Length</th>
                  <th className="py-2.5 px-3">Fever-Free</th>
                  <th className="py-2.5 px-3 text-right">Doctor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {readyList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-teal-400">
                      Room {p.roomNumber}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${p.id}`)}
                        className="font-semibold text-slate-100 hover:text-teal-300 transition text-left cursor-pointer"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {p.age}y • {p.gender}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Day {getDaysAdmitted(p.admittedAt)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400 font-mono">
                        <Sparkles size={12} className="text-amber-400" />
                        3/3 Days Cured
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canDoctorConfirm ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmDischarge(p)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer shadow-md shadow-blue-600/20"
                        >
                          Confirm Discharge
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          Awaiting Doctor Sign-off
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION B: DISCHARGE CONFIRMED */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white m-0">
                Stage 2: Discharge Confirmed (Admin Processing)
              </h2>
              <p className="text-[11px] text-slate-400">
                Medical discharge has been confirmed by a physician. Admin processes final paperwork and returns room to available pool.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold self-start sm:self-auto font-mono">
            {confirmedList.length} Pending Admin
          </span>
        </div>

        {confirmedList.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No patients currently awaiting final admin discharge.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Demographics</th>
                  <th className="py-2.5 px-3">Stay Length</th>
                  <th className="py-2.5 px-3">Room to Free</th>
                  <th className="py-2.5 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {confirmedList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-teal-400">
                      Room {p.roomNumber}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${p.id}`)}
                        className="font-semibold text-slate-100 hover:text-teal-300 transition text-left cursor-pointer"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {p.age}y • {p.gender}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Day {getDaysAdmitted(p.admittedAt)}
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-300">
                      <span className="flex items-center gap-1">
                        <DoorOpen size={13} /> Room {p.roomNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canAdminProcess ? (
                        <button
                          type="button"
                          onClick={() => handleProcessDischarge(p)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition cursor-pointer shadow-md shadow-purple-600/20 flex items-center gap-1.5 ml-auto"
                        >
                          <span>Process Discharge</span>
                          <ArrowRight size={14} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          Awaiting Admin Finalization
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
