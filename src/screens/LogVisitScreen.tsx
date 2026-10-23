import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Thermometer,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import {
  getPatientById,
  getTodaysReading,
  getTodaysVisit,
  logDoctorVisitOp,
  statusLabel,
} from '../lib/db';

export const LogVisitScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { appDate, dataVersion, triggerRefresh } = useAppData();
  const navigate = useNavigate();

  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patient = useMemo(() => {
    if (!id) return undefined;
    return getPatientById(id);
  }, [id, dataVersion]);

  const todaysReading = useMemo(() => {
    if (!id) return null;
    return getTodaysReading(id, appDate);
  }, [id, appDate, dataVersion]);

  const todaysVisit = useMemo(() => {
    if (!id) return null;
    return getTodaysVisit(id, appDate);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);

    if (!notes.trim()) {
      setError('Please provide clinical notes for this visit.');
      return;
    }

    setIsSubmitting(true);
    try {
      logDoctorVisitOp({
        patientId: patient.id,
        notes: notes.trim(),
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });

      triggerRefresh();
      setSuccess('Clinical visit notes successfully logged! Patient marked VISITED for today.');

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

      {/* Patient Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg font-mono">
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

      {/* R11 Hard Block Notice: If temperature has NOT been recorded today */}
      {!todaysReading ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-rose-300">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-rose-200 m-0">
                Cannot Log Visit — Rule R11 Hard Block
              </h2>
              <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                Temperature has not been recorded for this patient today ({appDate}). A doctor visit cannot be logged until today's temperature reading is on record.
              </p>
              <p className="text-[11px] text-rose-400/80 mt-2">
                As a doctor, if a nurse is unavailable, you may record the temperature as a fallback directly from the Patient List or the Record Temperature screen.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${patient.id}/record-temp`)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                >
                  <Thermometer size={14} />
                  <span>Record Fallback Temperature</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Return to Patient List
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visit Form with Today's Reading Summary */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          {/* Today's Reading Highlight */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Thermometer size={18} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Today's Temperature</span>
                <span className="text-base font-bold font-mono text-slate-100">
                  {todaysReading.valueCelsius}°C
                </span>
                <span
                  className={`ml-2 px-1.5 py-0.2 rounded text-[10px] font-medium ${
                    todaysReading.isFever
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {todaysReading.isFever ? 'Fever' : 'Normal'}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-mono space-y-0.5">
              <div className="flex items-center gap-1 justify-end">
                <Clock size={12} />
                <span>Recorded: {todaysReading.recordedAt.split('T')[1]?.substring(0, 5)}</span>
              </div>
              <div className="flex items-center gap-1 justify-end text-slate-500">
                <User size={12} />
                <span>By: {todaysReading.recordedBy}</span>
              </div>
            </div>
          </div>

          {todaysVisit && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
              <Clock size={15} className="shrink-0" />
              <span>A visit has already been logged today at {todaysVisit.visitedAt.split('T')[1]?.substring(0, 5)}. You may log additional consultation notes below.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Clinical Notes & Treatment Directives</span>
                <span className="text-[10px] text-slate-500 font-normal">Required</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record clinical assessment, medication changes, symptomatic progression, or discharge eligibility..."
                rows={5}
                required
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !notes.trim()}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg shadow-blue-600/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Stethoscope size={15} />
                <span>{isSubmitting ? 'Saving Visit Notes...' : 'Save Clinical Visit'}</span>
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
    </div>
  );
};
