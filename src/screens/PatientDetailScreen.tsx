import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Thermometer,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Phone,
  DoorOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  FileText,
  Skull,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import {
  getPatientById,
  getReadingsForPatient,
  getVisitsForPatient,
  getTodaysReading,
  getTodaysVisit,
  statusLabel,
  confirmDischargeOp,
  markPatientDeceasedOp,
  processFinalDischargeOp,
} from '../lib/db';
import { FEVER_THRESHOLD } from '../lib/constants';
import { hasPermission } from '../lib/permissions';

export const PatientDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { appDate, dataVersion, triggerRefresh } = useAppData();
  const navigate = useNavigate();

  const [showDeceasedModal, setShowDeceasedModal] = useState(false);
  const [deceasedNotes, setDeceasedNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const patient = useMemo(() => {
    if (!id) return undefined;
    return getPatientById(id);
  }, [id, dataVersion]);

  const readings = useMemo(() => {
    if (!id) return [];
    return getReadingsForPatient(id);
  }, [id, dataVersion]);

  const visits = useMemo(() => {
    if (!id) return [];
    return getVisitsForPatient(id);
  }, [id, dataVersion]);

  const todaysReading = useMemo(() => {
    if (!id) return null;
    return getTodaysReading(id, appDate);
  }, [id, appDate, dataVersion]);

  const todaysVisit = useMemo(() => {
    if (!id) return null;
    return getTodaysVisit(id, appDate);
  }, [id, appDate, dataVersion]);

  // SVG Chart points calculation
  const chartData = useMemo(() => {
    if (readings.length === 0) return null;

    const width = 600;
    const height = 180;
    const padX = 40;
    const padY = 25;

    const minTemp = 35.0;
    const maxTemp = 41.0;

    const scaleY = (temp: number) =>
      height - padY - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 2 * padY);

    const stepX = (width - 2 * padX) / Math.max(1, readings.length - 1);
    const points = readings.map((r, i) => ({
      x: padX + i * stepX,
      y: scaleY(r.valueCelsius),
      reading: r,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const feverY = scaleY(FEVER_THRESHOLD);

    return { width, height, points, pathD, feverY, minTemp, maxTemp, padX };
  }, [readings]);

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Patient not found.</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-3 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs"
        >
          Back to Patient List
        </button>
      </div>
    );
  }

  // Days admitted calculation
  const getDaysAdmitted = () => {
    const adm = new Date(patient.admittedAt.split('T')[0] + 'T00:00:00');
    const cur = new Date(appDate + 'T00:00:00');
    const diff = cur.getTime() - adm.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleConfirmDischarge = () => {
    if (!user) return;
    setActionError(null);
    try {
      confirmDischargeOp({
        patientId: patient.id,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });
      triggerRefresh();
      setActionSuccess('Discharge confirmed! Transferred to Admin final discharge queue.');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleProcessAdminDischarge = () => {
    if (!user) return;
    setActionError(null);
    try {
      processFinalDischargeOp({
        patientId: patient.id,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });
      triggerRefresh();
      setActionSuccess('Final discharge processed! Room freed immediately.');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const handleMarkDeceased = () => {
    if (!user) return;
    setActionError(null);
    try {
      markPatientDeceasedOp({
        patientId: patient.id,
        notes: deceasedNotes,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });
      setShowDeceasedModal(false);
      triggerRefresh();
      setActionSuccess('Patient record updated to DECEASED. Room freed immediately.');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    }
  };

  const canRecordTemp =
    (hasPermission(user?.role, 'record_temperature') ||
      hasPermission(user?.role, 'record_temperature_fallback')) &&
    !todaysReading &&
    patient.status !== 'DISCHARGED' &&
    patient.status !== 'DECEASED';

  const canLogVisit =
    hasPermission(user?.role, 'log_visit') &&
    todaysReading &&
    !todaysVisit &&
    patient.status !== 'DISCHARGED' &&
    patient.status !== 'DECEASED';

  const canConfirmDischarge =
    hasPermission(user?.role, 'confirm_discharge') &&
    patient.status === 'READY_FOR_DISCHARGE';

  const canProcessDischarge =
    hasPermission(user?.role, 'process_discharge') &&
    patient.status === 'DISCHARGE_CONFIRMED';

  const canMarkDeceased =
    hasPermission(user?.role, 'mark_deceased') &&
    patient.status !== 'DISCHARGED' &&
    patient.status !== 'DECEASED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Patients</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">Patient ID: {patient.id}</span>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Confirmation Modal for Mark Deceased */}
      {showDeceasedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
              <Skull size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Confirm Patient Death</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Recording this patient ({patient.name}) as deceased will close the medical record, free Room {patient.roomNumber} immediately, and update the facility mortality statistics.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Clinical Cause / Notes
              </label>
              <textarea
                value={deceasedNotes}
                onChange={(e) => setDeceasedNotes(e.target.value)}
                placeholder="Enter clinical summary or notes..."
                rows={3}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeceasedModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkDeceased}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Confirm Mark Deceased
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex flex-col items-center justify-center font-mono">
              <span className="text-[10px] text-teal-500/70 uppercase">Room</span>
              <span className="text-xl font-bold leading-none">
                {patient.roomNumber > 0 ? patient.roomNumber : 'Freed'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white m-0">{patient.name}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                    patient.status === 'READY_FOR_DISCHARGE'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : patient.status === 'DISCHARGE_CONFIRMED'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : patient.status === 'DISCHARGED'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : patient.status === 'DECEASED'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {statusLabel(patient.status)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>{patient.age} years old</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-slate-500" />
                  {patient.contact}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <DoorOpen size={12} className="text-slate-500" />
                  Room {patient.roomNumber > 0 ? patient.roomNumber : 'Unassigned (Closed)'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Stay Length
              </span>
              <span className="text-sm font-bold text-slate-100 font-mono">
                Day {getDaysAdmitted()}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Fever-Free
              </span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`w-2.5 h-2.5 rounded-full ${
                      patient.feverFreeDays >= step
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-emerald-400 font-mono ml-1">
                  {patient.feverFreeDays}/3
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Lifecycle Progression Timeline */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Status Lifecycle Progression
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {/* Step 1: ADMITTED */}
            <div
              className={`p-3 rounded-lg border ${
                patient.status === 'ADMITTED'
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>1. Admitted</span>
                <span className="text-[10px] font-mono">Day 1</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Under daily thermal monitoring</p>
            </div>

            {/* Step 2: READY_FOR_DISCHARGE */}
            <div
              className={`p-3 rounded-lg border ${
                patient.status === 'READY_FOR_DISCHARGE'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : patient.feverFreeDays >= 3
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-800/20 border-slate-800 text-slate-600'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>2. Ready Discharge</span>
                {patient.feverFreeDays >= 3 && <Sparkles size={13} className="text-amber-400" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">3 fever-free days completed</p>
            </div>

            {/* Step 3: DISCHARGE_CONFIRMED */}
            <div
              className={`p-3 rounded-lg border ${
                patient.status === 'DISCHARGE_CONFIRMED'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                  : patient.status === 'DISCHARGED'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-800/20 border-slate-800 text-slate-600'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>3. Confirmed</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Doctor signed off release</p>
            </div>

            {/* Step 4: OUTCOME */}
            <div
              className={`p-3 rounded-lg border ${
                patient.status === 'DISCHARGED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : patient.status === 'DECEASED'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-slate-800/20 border-slate-800 text-slate-600'
              }`}
            >
              <div className="font-semibold flex items-center justify-between">
                <span>
                  {patient.status === 'DECEASED'
                    ? '4. Deceased'
                    : patient.status === 'DISCHARGED'
                    ? '4. Discharged'
                    : '4. Final Release'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Room returned to pool</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 mr-2">Available Actions:</span>

          {canRecordTemp && (
            <button
              type="button"
              onClick={() => navigate(`/patients/${patient.id}/record-temp`)}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-teal-600/20"
            >
              <Thermometer size={14} />
              <span>Record Temperature</span>
            </button>
          )}

          {canLogVisit && (
            <button
              type="button"
              onClick={() => navigate(`/patients/${patient.id}/log-visit`)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Stethoscope size={14} />
              <span>Log Doctor Visit</span>
            </button>
          )}

          {canConfirmDischarge && (
            <button
              type="button"
              onClick={handleConfirmDischarge}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-600/20"
            >
              <CheckCircle2 size={14} />
              <span>Confirm Medical Discharge</span>
            </button>
          )}

          {canProcessDischarge && (
            <button
              type="button"
              onClick={handleProcessAdminDischarge}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/20"
            >
              <CheckCircle2 size={14} />
              <span>Process Final Discharge (Free Room)</span>
            </button>
          )}

          {canMarkDeceased && (
            <button
              type="button"
              onClick={() => setShowDeceasedModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ml-auto"
            >
              <Skull size={14} />
              <span>Mark Deceased</span>
            </button>
          )}
        </div>
      </div>

      {/* Temperature History & Interactive Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-teal-400" />
            <h2 className="text-sm font-bold text-white m-0">Temperature History & Trend</h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
              Fever Line (38.0°C)
            </span>
            <span className="flex items-center gap-1 text-teal-400">
              <span className="w-2.5 h-0.5 bg-teal-400 inline-block" />
              Patient Readings
            </span>
          </div>
        </div>

        {/* SVG Sparkline Chart */}
        {chartData && readings.length > 0 ? (
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full max-w-full h-44 text-slate-300"
            >
              {/* Fever Threshold 38.0 C Dashed Line */}
              <line
                x1="30"
                y1={chartData.feverY}
                x2={chartData.width - 20}
                y2={chartData.feverY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={chartData.width - 15}
                y={chartData.feverY + 4}
                fill="#f43f5e"
                fontSize="10"
                fontFamily="monospace"
              >
                38.0°C
              </text>

              {/* Data Path */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {chartData.points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.reading.isFever ? 5 : 4}
                    fill={pt.reading.isFever ? '#f43f5e' : '#2dd4bf'}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fill={pt.reading.isFever ? '#fca5a5' : '#cbd5e1'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {pt.reading.valueCelsius}°
                  </text>
                  <text
                    x={pt.x}
                    y={chartData.height - 8}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {pt.reading.recordedAt.split('T')[0].substring(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No temperature history recorded yet.</p>
        )}

        {/* History Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Temperature</th>
                <th className="py-2.5 px-3">Clinical Evaluation</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {readings.slice().reverse().map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {r.recordedAt.replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                    {r.valueCelsius}°C
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                        r.isFever
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {r.isFever ? 'Fever (≥38.0°C)' : 'Normal (<38.0°C)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{r.recordedBy}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {r.recordedByRole}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Visits Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          <h2 className="text-sm font-bold text-white m-0">Clinical Doctor Visit Notes</h2>
        </div>

        {visits.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No doctor visits recorded for this patient.</p>
        ) : (
          <div className="space-y-3">
            {visits.slice().reverse().map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar size={13} className="text-blue-400" />
                    {v.visitedAt.replace('T', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                    Doctor ID: {v.doctorId}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  {v.notes}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
