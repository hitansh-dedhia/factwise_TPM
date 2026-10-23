import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Sparkles } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { getActivePatients, statusLabel } from '../lib/db';
import { TOTAL_ROOMS } from '../lib/constants';

export const RoomOccupancyScreen: React.FC = () => {
  const { dataVersion } = useAppData();
  const navigate = useNavigate();

  const activePatients = useMemo(() => {
    return getActivePatients();
  }, [dataVersion]);

  // Create a fast map: roomNumber -> Patient
  const roomMap = useMemo(() => {
    const map = new Map<number, (typeof activePatients)[0]>();
    for (const p of activePatients) {
      if (p.roomNumber >= 1 && p.roomNumber <= TOTAL_ROOMS) {
        map.set(p.roomNumber, p);
      }
    }
    return map;
  }, [activePatients]);

  const occupiedCount = roomMap.size;
  const freeCount = TOTAL_ROOMS - occupiedCount;
  const occupancyRate = ((occupiedCount / TOTAL_ROOMS) * 100).toFixed(1);

  // Array 1 to 74
  const allRooms = useMemo(() => {
    return Array.from({ length: TOTAL_ROOMS }, (_, i) => i + 1);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 m-0">
            <DoorOpen size={22} className="text-teal-400" />
            <span>Room Occupancy Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live interactive floor plan of all {TOTAL_ROOMS} facility isolation rooms
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-500/20 border border-teal-500/40 inline-block" />
            <span className="text-slate-300">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block" />
            <span className="text-amber-300">Ready Release</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" />
            <span className="text-slate-400">Available</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Total Facility Beds</span>
          <span className="text-xl font-bold text-slate-100 font-mono mt-0.5 block">
            {TOTAL_ROOMS}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Occupied Rooms</span>
          <span className="text-xl font-bold text-teal-400 font-mono mt-0.5 block">
            {occupiedCount}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Available / Free</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
            {freeCount}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Occupancy Rate</span>
          <span className="text-xl font-bold text-slate-100 font-mono mt-0.5 block">
            {occupancyRate}%
          </span>
        </div>
      </div>

      {/* 74 Room Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span>Click any occupied room to open the patient's clinical file</span>
          <span className="font-mono text-teal-400 font-medium">
            {occupiedCount} of {TOTAL_ROOMS} Occupied
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 pt-2">
          {allRooms.map((roomNum) => {
            const patient = roomMap.get(roomNum);
            const isOccupied = !!patient;
            const isReady = patient?.status === 'READY_FOR_DISCHARGE';
            const isConfirmed = patient?.status === 'DISCHARGE_CONFIRMED';

            if (!isOccupied) {
              return (
                <div
                  key={roomNum}
                  className="h-20 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between text-left opacity-60 hover:opacity-80 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      #{roomNum}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  </div>
                  <span className="text-[10px] text-slate-600 uppercase font-medium">Vacant</span>
                </div>
              );
            }

            return (
              <button
                key={roomNum}
                type="button"
                onClick={() => navigate(`/patients/${patient.id}`)}
                className={`h-20 p-2 rounded-xl text-left flex flex-col justify-between transition group cursor-pointer border ${
                  isReady
                    ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20'
                    : isConfirmed
                    ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20'
                    : 'bg-teal-500/10 border-teal-500/30 hover:border-teal-400 hover:bg-teal-500/20'
                }`}
                title={`Room ${roomNum}: ${patient.name} (${patient.age}y, ${patient.gender}) • Status: ${statusLabel(
                  patient.status
                )} • Fever-free: ${patient.feverFreeDays}/3`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isReady
                        ? 'text-amber-400'
                        : isConfirmed
                        ? 'text-purple-400'
                        : 'text-teal-400'
                    }`}
                  >
                    #{roomNum}
                  </span>
                  <div className="flex items-center gap-1">
                    {isReady && <Sparkles size={10} className="text-amber-400" />}
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isReady
                          ? 'bg-amber-400 animate-pulse'
                          : isConfirmed
                          ? 'bg-purple-400'
                          : 'bg-teal-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-100 truncate block group-hover:text-teal-300 transition-colors">
                    {patient.name.split(' ')[0]}
                  </span>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                    <span>{patient.feverFreeDays}/3 FF</span>
                    <span className="text-slate-500">{patient.age}y</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
