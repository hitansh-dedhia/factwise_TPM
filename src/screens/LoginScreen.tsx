import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, AlertCircle, KeyRound, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_USERS } from '../lib/seed';
import { ROLE_LABELS, ROLE_COLORS, getRoleHomeRoute } from '../lib/permissions';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(getRoleHomeRoute(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = login(username.trim(), password);
      if (result.success && result.homeRoute) {
        navigate(result.homeRoute, { replace: true });
      } else {
        setError(result.error ?? 'Invalid credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Instant 1-click login for reviewers
  const handleInstantLogin = (u: typeof SEED_USERS[0]) => {
    setError(null);
    const result = login(u.username, u.password);
    if (result.success && result.homeRoute) {
      navigate(result.homeRoute, { replace: true });
    }
  };

  const handleQuickFill = (u: typeof SEED_USERS[0]) => {
    setUsername(u.username);
    setPassword(u.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
          <Activity size={28} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white m-0">ViralTrack</h1>
          <p className="text-xs text-slate-400 m-0">Quarantine & Treatment Facility Management</p>
        </div>
      </div>

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-slate-200">System Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in manually or use any demo account below for instant evaluation
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. nurse1, doctor1, admin1"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-lg font-medium text-sm transition shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In with Credentials'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div className="mt-8 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-amber-400">
              <KeyRound size={15} />
              <span className="text-xs font-bold tracking-wide uppercase">
                Demo Accounts & Roles
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Instant Login</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Click <strong className="text-teal-400 font-semibold">1-Click Login</strong> on any card to immediately test role-based permissions and workflows, or click the credentials to auto-fill the form:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEED_USERS.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">{u.name}</span>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      <span className="text-slate-500">User:</span>{' '}
                      <span
                        onClick={() => handleQuickFill(u)}
                        className="text-teal-300 underline cursor-pointer hover:text-teal-200"
                        title="Click to copy to form"
                      >
                        {u.username}
                      </span>
                      <span className="mx-1 text-slate-600">•</span>
                      <span className="text-slate-500">Pass:</span>{' '}
                      <span
                        onClick={() => handleQuickFill(u)}
                        className="text-teal-300 underline cursor-pointer hover:text-teal-200"
                        title="Click to copy to form"
                      >
                        {u.password}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                      ROLE_COLORS[u.role]
                    }`}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleInstantLogin(u)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap size={13} />
                  <span>1-Click Login as {ROLE_LABELS[u.role]}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        ViralTrack Prototype • 74-Bed Viral Quarantine & Treatment Facility
      </div>
    </div>
  );
};
