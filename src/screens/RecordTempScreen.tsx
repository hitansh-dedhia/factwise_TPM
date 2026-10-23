import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Thermometer,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  History,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import {
  getPatientById,
  getReadingsForPatient,
  getTodaysReading,
  recordTemperatureOp,
  statusLabel,
} from '../lib/db';
import { FEVER_THRESHOLD, TEMP_MIN, TEMP_MAX } from '../lib/constants';

export const RecordTempScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { appDate, dataVersion, triggerRefresh } = useAppData();
  const navigate = useNavigate();

  const [valueStr, setValueStr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patient = useMemo(() => {
    if (!id) return undefined;
    return getPatientById(id);
  }, [id, dataVersion]);

  const recentReadings = useMemo(() => {
    if (!id) return [];
    return getReadingsForPatient(id).slice(-5).reverse();
  }, [id, dataVersion]);

  const todaysReading = useMemo(() => {
    if (!id) return null;
    return getTodaysReading(id, appDate);
  }, [id, appDate, dataVersion]);

  if (!patient) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>Patient not found.</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs"
        >
          Return to Patients
        </button>
      </div>
    );
  }

  const numVal = parseFloat(valueStr);
  const isInputValid = !isNaN(numVal) && numVal >= TEMP_MIN && numVal <= TEMP_MAX;
  const willBeFever = !isNaN(numVal) && numVal >= FEVER_THRESHOLD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccessMsg(null);

    if (!isInputValid) {
      setError(`Temperature must be between ${TEMP_MIN}°C and ${TEMP_MAX}°C.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const reading = recordTemperatureOp({
        patientId: patient.id,
        valueCelsius: numVal,
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });

      triggerRefresh();
      setSuccessMsg(
        `Recorded ${reading.valueCelsius}°C successfully! ${
          reading.isFever ? 'Fever detected (fever-free counter reset).' : 'Normal temperature.'
        }`
      );

      setTimeout(() => {
        navigate(`/patients/${patient.id}`);
      }, 1500);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Patient Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg font-mono">
            {patient.roomNumber}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white m-0">{patient.name}</h1>
            <p className="text-xs text-slate-400 m-0">
              Room {patient.roomNumber} • {patient.age}y {patient.gender} • Contact: {patient.contact}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {statusLabel(patient.status)}
          </span>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
            <span className="text-slate-400">Fever-free:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {patient.feverFreeDays}/3 days
            </span>
          </div>
        </div>
      </div>

      {/* Hard Block Notice if already recorded today (R10) */}
      {todaysReading ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-amber-300">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-200 m-0">
                Temperature Already Recorded Today (Rule R10 Hard Block)
              </h2>
              <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                A daily reading has already been saved for this patient on{' '}
                <span className="font-semibold font-mono">{appDate}</span>:
              </p>
              <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/20 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-amber-400/80">Value: </span>
                  <span className="font-bold text-white text-base">
                    {todaysReading.valueCelsius}°C
                  </span>
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] rounded ${
                      todaysReading.isFever
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {todaysReading.isFever ? 'FEVER' : 'NORMAL'}
                  </span>
                </div>
                <div>
                  <span className="text-amber-400/80">Time: </span>
                  <span className="text-slate-200">
                    {todaysReading.recordedAt.split('T')[1]?.substring(0, 5)}
                  </span>
                </div>
                <div>
                  <span className="text-amber-400/80">Recorded by: </span>
                  <span className="text-slate-200">
                    {todaysReading.recordedByRole} ({todaysReading.recordedBy})
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-amber-400/70 mt-3">
                Per facility protocol, duplicate daily readings are strictly blocked. To record a new reading for a subsequent day, use the "Simulate Next Day" demo tool in the sidebar.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/40 transition cursor-pointer"
                >
                  View Full Patient Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Measurement Entry Form */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2.5 mb-4 text-slate-100">
            <Thermometer size={18} className="text-teal-400" />
            <h2 className="text-sm font-semibold m-0">Record Daily Temperature</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Temperature Reading (°C)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.1"
                  min={TEMP_MIN}
                  max={TEMP_MAX}
                  required
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="e.g. 37.2"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-lg font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  °Celsius
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Valid clinical range: {TEMP_MIN}°C – {TEMP_MAX}°C • Fever threshold: ≥{FEVER_THRESHOLD}°C
              </p>
            </div>

            {/* Live Indicator */}
            {valueStr && !isNaN(numVal) && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  willBeFever
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {willBeFever ? (
                    <Flame size={16} className="text-rose-400" />
                  ) : (
                    <Sparkles size={16} className="text-emerald-400" />
                  )}
                  <span>
                    {willBeFever
                      ? `Fever Detected (≥${FEVER_THRESHOLD}°C). Fever-free days will reset to 0.`
                      : `Normal Temperature (<${FEVER_THRESHOLD}°C). Fever-free days will increase to ${Math.min(
                          3,
                          patient.feverFreeDays + 1
                        )}/3.`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!isInputValid || isSubmitting}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shadow-lg shadow-teal-600/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving Reading...' : 'Save Temperature Reading'}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Readings History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3 text-slate-200">
          <History size={16} className="text-slate-400" />
          <h2 className="text-xs font-semibold m-0">Recent Readings History</h2>
        </div>

        {recentReadings.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No prior readings recorded for this patient.</p>
        ) : (
          <div className="space-y-2">
            {recentReadings.map((r) => (
              <div
                key={r.id}
                className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock size={12} />
                    {r.recordedAt.replace('T', ' ')}
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <User size={12} />
                    {r.recordedByRole}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {r.valueCelsius}°C
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      r.isFever
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {r.isFever ? 'Fever' : 'Normal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
