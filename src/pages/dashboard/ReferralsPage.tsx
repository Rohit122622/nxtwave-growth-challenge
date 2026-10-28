import { useState, useEffect } from 'react';
import { 
  Share2, 
  MousePointerClick, 
  Users, 
  Award, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getReferralAnalytics } from '../../lib/api';
import { useDataMode } from '../../contexts/DataModeContext';
import { LoadingSpinner, ErrorState, EmptyState } from '../../components/ui/States';
import { buildReferralUrl, copyToClipboard } from '../../lib/utils';
import type { ReferralAnalytics } from '../../types';

export default function ReferralsPage() {
  const { isDemo, refreshKey } = useDataMode();
  const [data, setData] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testCode, setTestCode] = useState('STUDENT1');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchReferrals() {
      setLoading(true);
      setError(null);
      try {
        const res = await getReferralAnalytics(isDemo);
        if (mounted) setData(res);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load referral data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchReferrals();
    return () => { mounted = false; };
  }, [isDemo, refreshKey]);

  const handleCopy = async (code: string) => {
    const url = buildReferralUrl(code);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) return <LoadingSpinner message="Analyzing referral program performance..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load referral analytics'} />;

  const conversionRate = data.totalClicks > 0 
    ? Math.round((data.totalReferralRegistrations / data.totalClicks) * 100 * 10) / 10 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Referral Program Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Student-to-student viral loop tracking and click-to-registration attribution.
          </p>
        </div>
      </div>

      {/* Referral KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Referral Registrations</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.totalReferralRegistrations}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Validated code attributions
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Referral Link Clicks</span>
            <MousePointerClick className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.totalClicks}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Tracked click events on ?ref= links
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Click-to-Reg Conversion</span>
            <Share2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.totalClicks > 0 ? `${conversionRate}%` : 'N/A'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {data.totalClicks > 0 ? 'Verified funnel conversion' : 'Requires referral clicks'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Active Student Referrers</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.referrers.length}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Students with ≥1 attributed peer
          </div>
        </div>
      </div>

      {/* Referrers Leaderboard & Click Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Student Referrers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Student Referrers</h2>
              <p className="text-xs text-slate-400">Ranked by attributed completed registrations</p>
            </div>
            <Award className="w-4 h-4 text-purple-400" />
          </div>

          {data.referrers.length === 0 ? (
            <div className="py-8">
              <EmptyState 
                title="No active referrers yet" 
                description="When students share their personal referral link and peers register, they will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/60 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Rank</th>
                    <th className="py-2.5 px-3 font-semibold">Student Name</th>
                    <th className="py-2.5 px-3 font-semibold">Referral Code</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Attributed Regs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.referrers.map((r, i) => (
                    <tr key={r.code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-400">
                        #{i + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {r.referrer_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-blue-400">
                        {r.code}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {r.referral_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tracked Referral Clicks */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Referral Link Click Activity</h2>
              <p className="text-xs text-slate-400">Recorded clicks on peer invitation links</p>
            </div>
            <MousePointerClick className="w-4 h-4 text-blue-400" />
          </div>

          {data.clicks.length === 0 ? (
            <div className="py-8">
              <EmptyState 
                title="No link clicks recorded" 
                description="Clicks are logged automatically when visitors arrive via ?ref= links."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/60 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Referral Code</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Click Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.clicks.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-400">
                        {c.code}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        {c.click_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Program Integrity & Fraud Prevention */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Referral System Integrity Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-white block mb-1">1. Verification Check</span>
            <p className="text-slate-400 text-[11px]">Referral codes are checked against registered students before attributing credit. Non-existent codes are ignored.</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-white block mb-1">2. Self-Referral Prevention</span>
            <p className="text-slate-400 text-[11px]">The server verifies that the registering student's email does not match the referrer's email, preventing self-attribution.</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-white block mb-1">3. Duplicate Email Protection</span>
            <p className="text-slate-400 text-[11px]">Normalized email addresses enforce uniqueness in the database, preventing inflated counts through repeated registrations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
