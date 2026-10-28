import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/States';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export function AdminRoute() {
  const { user, loading, isAdmin, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <LoadingSpinner message="Verifying administrative credentials..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1e293b] border border-red-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            403 — Administrative Access Forbidden
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            You are authenticated as <strong>{user.fullName}</strong> (<span className="text-slate-300 font-mono text-xs">{user.email}</span>) with role <code className="text-blue-400 font-semibold">{user.role}</code>.
            This growth operations workspace is strictly reserved for administrative accounts.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/student/dashboard"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Student Dashboard
            </Link>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              Log Out of Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export function StudentRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <LoadingSpinner message="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
