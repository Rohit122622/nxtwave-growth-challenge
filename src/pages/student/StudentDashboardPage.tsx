import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Cpu, 
  LogOut, 
  Copy, 
  Check, 
  Users, 
  CheckCircle2, 
  Award, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Share2, 
  KeyRound, 
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentProfile, changePassword, ApiError } from '../../lib/api';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/ui/States';
import { buildReferralUrl, copyToClipboard, formatDate } from '../../lib/utils';
import type { StudentDashboardResponse } from '../../types';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referral copy feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confPassword, setConfPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudentProfile();
        if (mounted) setData(res);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load student data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleCopyLink = async () => {
    if (!data?.student?.ownReferralCode) return;
    const url = buildReferralUrl(data.student.ownReferralCode);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    if (!data?.student?.ownReferralCode) return;
    const ok = await copyToClipboard(data.student.ownReferralCode);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    setPwdLoading(true);
    try {
      const res = await changePassword({
        currentPassword: curPassword,
        newPassword,
        confirmPassword: confPassword,
      });
      setPwdMsg({ text: res.message, error: false });
      setCurPassword('');
      setNewPassword('');
      setConfPassword('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to change password.', error: true });
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <LoadingSpinner message="Retrieving your student profile..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-warm-50 p-6 flex items-center justify-center">
        <ErrorState message={error || 'Could not fetch your profile'} />
      </div>
    );
  }

  const { student, referrals, hasRegistration } = data;
  const referralUrl = student?.ownReferralCode ? buildReferralUrl(student.ownReferralCode) : '';

  return (
    <div className="min-h-screen bg-warm-50 text-navy-900 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-navy-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-navy-900 text-sm tracking-tight block">AI Workshop</span>
              <span className="text-[10px] text-navy-500 font-medium block -mt-0.5">Student Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-xs font-semibold text-navy-600 hover:text-navy-900 px-3 py-1.5 rounded-lg border border-navy-200 hover:bg-navy-50 transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs font-semibold mb-2 border border-accent-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Student Account
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {student?.fullName || user?.fullName}!
            </h1>
            <p className="text-navy-300 text-xs sm:text-sm mt-1">
              Registered with <span className="text-white font-mono">{student?.email || user?.email}</span>
            </p>
          </div>

          <div className="text-right self-stretch sm:self-auto bg-navy-800/80 p-3 sm:p-4 rounded-xl border border-navy-700/60">
            <span className="text-[10px] text-navy-400 uppercase tracking-wider block font-semibold">Workshop Status</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Confirmed Attendee
            </span>
          </div>
        </div>

        {!hasRegistration || !student ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-navy-100 p-12 text-center shadow-sm">
            <EmptyState
              title="No workshop registration found"
              description="Your account is active, but you have not yet reserved a spot for the 60-Minute AI Workshop."
              icon={<Cpu className="w-10 h-10 text-navy-400 mx-auto" />}
            />
            <Link
              to="/register"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Reserve Your Workshop Seat Now &rarr;
            </Link>
          </div>
        ) : (
          <>
            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Registration Details Card */}
              <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 text-navy-900 border-b border-navy-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Workshop Registration</h2>
                    <p className="text-[11px] text-navy-500">Free 60-Minute AI Session</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-navy-400 block text-[10px] uppercase font-semibold">Registration ID</span>
                    <span className="font-mono text-sm font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded border border-accent-100 inline-block mt-0.5">
                      {student.registrationId}
                    </span>
                  </div>

                  <div>
                    <span className="text-navy-400 block text-[10px] uppercase font-semibold">Institution</span>
                    <span className="font-semibold text-navy-800">{student.college}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-navy-400 block text-[10px] uppercase font-semibold">Degree / Branch</span>
                      <span className="font-semibold text-navy-800">{student.branch}</span>
                    </div>
                    <div>
                      <span className="text-navy-400 block text-[10px] uppercase font-semibold">Batch Year</span>
                      <span className="font-semibold text-navy-800">Class of {student.graduationYear}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-navy-100 flex justify-between items-center text-[11px] text-navy-500">
                    <span>Registered on:</span>
                    <span className="font-medium text-navy-700">{formatDate(student.createdAt!)}</span>
                  </div>
                </div>
              </div>

              {/* Personal Referral Hub Card */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-navy-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                    <div className="flex items-center gap-2.5 text-navy-900">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold">Your Personal Referral Hub</h2>
                        <p className="text-[11px] text-navy-500">Invite classmates to build side-by-side</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Referral Code
                    </span>
                  </div>

                  <p className="text-xs text-navy-600 mt-3 leading-relaxed">
                    Share your personalized invitation link with final-year engineering friends. When they register using your link, it is securely attributed to your profile.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {/* Code */}
                    <div className="p-3 bg-warm-50 rounded-xl border border-navy-100">
                      <span className="text-[10px] text-navy-500 uppercase tracking-wider font-semibold block mb-1">
                        Your Referral Code
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-extrabold text-navy-900">
                          {student.ownReferralCode}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-1.5 rounded-lg bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-3 bg-warm-50 rounded-xl border border-navy-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-navy-500 uppercase tracking-wider font-semibold block mb-0.5">
                          Peers Registered
                        </span>
                        <span className="text-2xl font-extrabold text-emerald-600">
                          {referrals?.totalReferred || 0}
                        </span>
                        <span className="text-[11px] text-navy-500 ml-1.5">attributed peers</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-navy-400 block font-semibold uppercase">Link Clicks</span>
                        <span className="text-sm font-bold text-navy-700">{referrals?.totalClicks || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shareable Link Box */}
                  <div className="mt-3">
                    <label className="text-[10px] text-navy-500 uppercase tracking-wider font-semibold block mb-1">
                      Direct Referral Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralUrl}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 px-3 py-2 bg-navy-50 rounded-xl border border-navy-200 text-xs font-mono text-navy-800 truncate"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? 'Link Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preparation / Workshop Roadmap Card */}
            <div className="bg-white rounded-2xl border border-navy-100 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accent-600" />
                Workshop Checklist &amp; What to Prepare
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-warm-50 rounded-xl border border-navy-100 space-y-1">
                  <span className="font-bold text-navy-800 block">1. Laptop Ready</span>
                  <p className="text-navy-600 text-[11px] leading-relaxed">
                    Have any code editor installed (VS Code, Cursor, or PyCharm). A standard browser and internet connection are all you need.
                  </p>
                </div>
                <div className="p-4 bg-warm-50 rounded-xl border border-navy-100 space-y-1">
                  <span className="font-bold text-navy-800 block">2. Python Basics</span>
                  <p className="text-navy-600 text-[11px] leading-relaxed">
                    Basic programming familiarity in Python (variables, functions, API calls). No advanced machine learning calculus required.
                  </p>
                </div>
                <div className="p-4 bg-warm-50 rounded-xl border border-navy-100 space-y-1">
                  <span className="font-bold text-navy-800 block">3. 60-Minute Focus</span>
                  <p className="text-navy-600 text-[11px] leading-relaxed">
                    Block 60 minutes of quiet time. You'll build the working AI Text Summarizer prototype and leave with starter repository code.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-navy-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-accent-600" />
                Update Password
              </h3>
              <button
                onClick={() => { setShowPasswordModal(false); setPwdMsg(null); }}
                className="text-xs text-navy-400 hover:text-navy-700 font-bold"
              >
                &times;
              </button>
            </div>

            {pwdMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium ${pwdMsg.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-navy-700 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={curPassword}
                  onChange={(e) => setCurPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-navy-700 font-semibold mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-navy-700 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confPassword}
                  onChange={(e) => setConfPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 text-xs font-semibold bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm"
                >
                  {pwdLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-navy-400 border-t border-navy-100 bg-white">
        NxtWave AI Workshop &middot; Authenticated Student Portal &middot; Data Strictly Scoped to Your Session
      </footer>
    </div>
  );
}
