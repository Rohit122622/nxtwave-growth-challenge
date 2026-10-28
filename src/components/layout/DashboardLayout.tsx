import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Share2, 
  Layers, 
  CalendarRange, 
  FlaskConical, 
  Menu, 
  X, 
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DataModeBanner } from '../ui/DataModeBanner';
import { useDataMode } from '../../contexts/DataModeContext';
import { useAuth } from '../../contexts/AuthContext';
import { issueClaimToken } from '../../lib/api';

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDemo } = useDataMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Admin Claim Modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimResult, setClaimResult] = useState<any>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  const navItems = [
    { name: 'Growth Overview', path: '/dashboard', icon: BarChart3, end: true },
    { name: 'Registrations', path: '/dashboard/registrations', icon: Users },
    { name: 'Acquisition Channels', path: '/dashboard/channels', icon: Layers },
    { name: 'Referral Program', path: '/dashboard/referrals', icon: Share2 },
    { name: '7-Day Campaign & Ops', path: '/dashboard/campaign', icon: CalendarRange },
    { name: 'Growth Experiments', path: '/dashboard/experiments', icon: FlaskConical },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const handleIssueClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimResult(null);
    setClaimLoading(true);
    try {
      const res = await issueClaimToken(claimEmail);
      setClaimResult(res);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to issue claim token.');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Banner indicating Demo / Live Mode */}
      <DataModeBanner />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-[#1e293b] border-r border-slate-700/60 p-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              NW
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                Growth Ops
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Admin
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[140px]" title={user?.email}>
                {user?.email || 'Administrator'}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Growth Navigation
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-700/60 space-y-2">
            {/* Authenticated Session Box */}
            <div className="p-3 rounded-lg bg-slate-800/80 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Session Secured &middot; Role: Admin
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Protected by HttpOnly cookies, CSRF defense, and server-side RBAC.
              </p>
            </div>

            {/* Account Claim Tool for Admins */}
            <button
              onClick={() => setShowClaimModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Issue Student Claim Link
              </span>
            </button>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-red-500/20"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out of Admin Console
              </span>
            </button>

            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                Public Landing Page
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>
          </div>
        </aside>

        {/* Mobile Header & Overlay */}
        <div className="md:hidden w-full flex flex-col">
          <header className="h-14 bg-[#1e293b] border-b border-slate-700/60 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                NW
              </div>
              <span className="text-sm font-semibold text-white">Growth Ops (Admin)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="bg-[#1e293b] border-b border-slate-700 p-4 space-y-1.5 shadow-xl animate-in fade-in duration-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
              <div className="pt-3 mt-2 border-t border-slate-700 flex justify-between items-center text-xs">
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  View Landing Page
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0b1120]">
          <Outlet />
        </main>
      </div>

      {/* Admin Claim Token Generator Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Issue Student Account Claim Link
              </h3>
              <button
                onClick={() => { setShowClaimModal(false); setClaimResult(null); setClaimError(null); }}
                className="text-slate-400 hover:text-white font-bold text-base"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a secure, single-use, time-limited activation token for a student who registered before authentication was enabled.
            </p>

            {claimError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {claimResult ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Claim Link Generated for {claimResult.studentName}
                </div>
                <div className="space-y-1 text-slate-300">
                  <span className="block text-[10px] text-slate-400 uppercase">Shareable Claim URL:</span>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${claimResult.claimUrl}`}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-blue-400"
                  />
                  <span className="block text-[10px] text-slate-500">Expires: {claimResult.expiresAt}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${claimResult.claimUrl}`);
                    alert('Copied activation URL to clipboard!');
                  }}
                  className="mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                >
                  Copy Activation Link
                </button>
              </div>
            ) : (
              <form onSubmit={handleIssueClaim} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student Registered Email</label>
                  <input
                    type="email"
                    required
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl shadow-sm"
                  >
                    {claimLoading ? 'Generating...' : 'Generate Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
