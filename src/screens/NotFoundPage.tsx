import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleHomeRoute } from '../lib/permissions';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
        <FileQuestion size={36} />
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Page Not Found (404)</h1>
      <p className="text-slate-400 max-w-md mb-6 text-sm">
        The screen or resource you are looking for does not exist.
      </p>
      <button
        onClick={() => (user ? navigate(getRoleHomeRoute(user.role)) : navigate('/login'))}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
      >
        <Home size={16} /> Return to Home
      </button>
    </div>
  );
};
