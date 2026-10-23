import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleHomeRoute, ROLE_LABELS } from '../lib/permissions';

export const AccessDeniedPage: React.FC<{ attemptedPath?: string }> = ({ attemptedPath }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturnHome = () => {
    if (user) {
      navigate(getRoleHomeRoute(user.role));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <ShieldAlert size={36} />
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Denied (403)</h1>
      <p className="text-slate-400 max-w-md mb-4 text-sm leading-relaxed">
        Your role ({user ? <span className="font-semibold text-rose-400">{ROLE_LABELS[user.role]}</span> : 'Unknown'}) is not authorized to access the requested page: <span className="text-slate-300 font-mono text-xs">{attemptedPath ?? 'this screen'}</span>.
      </p>
      <button
        onClick={handleReturnHome}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Return to Home
      </button>
    </div>
  );
};
