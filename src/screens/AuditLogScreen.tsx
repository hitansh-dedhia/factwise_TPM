import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Clock, User, Shield, ArrowUpRight } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { getAuditLog } from '../lib/db';
import { ROLE_LABELS, ROLE_COLORS } from '../lib/permissions';

export const AuditLogScreen: React.FC = () => {
  const { dataVersion } = useAppData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const auditEntries = useMemo(() => {
    return getAuditLog();
  }, [dataVersion]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return auditEntries;
    const q = searchQuery.toLowerCase().trim();
    return auditEntries.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q) ||
        e.userRole.toLowerCase().includes(q) ||
        (e.patientName && e.patientName.toLowerCase().includes(q)) ||
        (e.patientId && e.patientId.toLowerCase().includes(q))
    );
  }, [auditEntries, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 m-0">
            <ClipboardList size={22} className="text-teal-400" />
            <span>Facility Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident chronological log of all clinical actions, status changes, and room allocations (Rule R16)
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
            placeholder="Search action, user, or patient..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield size={14} className="text-teal-400" />
            <span>Audit Records ({filteredEntries.length} total events)</span>
          </span>
          <span className="text-[11px] text-slate-500">Sorted newest first</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Details</th>
                <th className="py-3 px-4">Subject Patient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500" />
                        <span>{e.timestamp.replace('T', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-500" />
                        <span>{e.userName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          ROLE_COLORS[e.userRole]
                        }`}
                      >
                        {ROLE_LABELS[e.userRole]}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-200 leading-relaxed font-sans max-w-md">
                      {e.action}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {e.patientName ? (
                        <button
                          type="button"
                          onClick={() => e.patientId && navigate(`/patients/${e.patientId}`)}
                          className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium transition cursor-pointer"
                        >
                          <span>{e.patientName}</span>
                          <ArrowUpRight size={12} />
                        </button>
                      ) : (
                        <span className="text-slate-600 italic text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
