import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  DoorOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { getFreeRooms, admitPatientOp, getOccupiedRoomNumbers } from '../lib/db';
import type { Gender } from '../lib/types';
import { TOTAL_ROOMS } from '../lib/constants';

export const AdmitPatientScreen: React.FC = () => {
  const { user } = useAuth();
  const { dataVersion, triggerRefresh } = useAppData();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [contact, setContact] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const freeRooms = useMemo(() => {
    return getFreeRooms();
  }, [dataVersion]);

  const occupiedCount = useMemo(() => {
    return getOccupiedRoomNumbers().size;
  }, [dataVersion]);

  const isFull = freeRooms.length === 0 || occupiedCount >= TOTAL_ROOMS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    const ageNum = parseInt(ageStr, 10);
    if (!name.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      setError('Please provide a valid patient age.');
      return;
    }
    if (!contact.trim()) {
      setError('Emergency contact number is required.');
      return;
    }
    if (selectedRoom === '') {
      setError('Please select an available room.');
      return;
    }

    setIsSubmitting(true);
    try {
      const patient = admitPatientOp({
        name: name.trim(),
        age: ageNum,
        gender,
        contact: contact.trim(),
        roomNumber: Number(selectedRoom),
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
      });

      triggerRefresh();
      navigate(`/patients/${patient.id}`);
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

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 m-0">
          <UserPlus size={22} className="text-teal-400" />
          <span>Admit New Patient</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Admission to quarantine facility. Requires verification of vacant room capacity.
        </p>
      </div>

      {/* Capacity Indicator Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <DoorOpen size={18} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Facility Room Status</span>
            <span className="font-semibold text-slate-200">
              {occupiedCount} of {TOTAL_ROOMS} Occupied ({freeRooms.length} Available)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              isFull
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isFull ? 'Facility at 100% Capacity' : `${freeRooms.length} Free Rooms`}
          </span>
        </div>
      </div>

      {/* R13 Full Block Notice if all 74 rooms are occupied */}
      {isFull ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-300 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-rose-200 m-0">
                Facility Full — Rule R13 Admission Blocked
              </h2>
              <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                All 74 quarantine rooms are currently occupied. Per facility safety regulations, a patient cannot be admitted until an existing patient is discharged or deceased and their room is freed.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/discharge')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  Inspect Discharge Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Admission Form */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Sharma"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Age (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  required
                  value={ageStr}
                  onChange={(e) => setAgeStr(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Contact / Next of Kin
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Assign Quarantine Room (Free Rooms Only)
              </label>
              <select
                required
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="">Select an available room...</option>
                {freeRooms.map((r) => (
                  <option key={r} value={r}>
                    Room {r} (Available)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Only verified vacant rooms are displayed per protocol R14.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Admitting Patient...' : 'Confirm Admission'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
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
