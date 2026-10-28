import { useEffect, useState } from 'react';
import { 
  Users, 
  Target, 
  Share2, 
  Layers, 
  ArrowUpRight, 
  TrendingUp, 
  HelpCircle,
  Clock,
  ChevronRight,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { getAnalyticsOverview, getRegistrations } from '../../lib/api';
import { useDataMode } from '../../contexts/DataModeContext';
import { LoadingSpinner, ErrorState } from '../../components/ui/States';
import { formatSourceName, formatDate, getSourceColor } from '../../lib/utils';
import type { AnalyticsOverview, Registration } from '../../types';

export default function OverviewPage() {
  const { isDemo, refreshKey } = useDataMode();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [recentRegs, setRecentRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, regRes] = await Promise.all([
          getAnalyticsOverview(isDemo),
          getRegistrations({ demo: isDemo, page: 1, limit: 5 })
        ]);
        if (mounted) {
          setData(overviewRes);
          setRecentRegs(regRes.registrations);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch analytics');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [isDemo, refreshKey]);

  if (loading) return <LoadingSpinner message="Calculating growth metrics..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load data'} />;

  const TARGET = 500;
  const progressPercent = Math.min(100, Math.round((data.totalRegistrations / TARGET) * 100 * 10) / 10);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Growth Analytics Overview
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              isDemo ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isDemo ? 'Simulated Data' : 'Live Data'}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tracking target of 500 final-year registrations in 7 days (₹2,000 budget cap).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/registrations"
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            All Registrations
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/register"
            target="_blank"
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Open Form
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Registrations</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.totalRegistrations}
            </span>
            <span className="text-xs text-slate-400">
              / {TARGET} target
            </span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
              <span>Goal Completion</span>
              <span className="text-blue-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Target Remaining */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Gap to Target</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {Math.max(0, TARGET - data.totalRegistrations)}
            </span>
            <span className="text-xs text-slate-400">spots left</span>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>7-day sprint campaign window</span>
          </div>
        </div>

        {/* Referral-Attributed Registrations */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Referral Attributed</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.referralRegistrations}
            </span>
            <span className="text-xs text-slate-400">
              ({data.totalRegistrations > 0 ? Math.round((data.referralRegistrations / data.totalRegistrations) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            K-factor virality contribution
          </div>
        </div>

        {/* Channels Active */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Active Channels</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {data.bySource.length}
            </span>
            <span className="text-xs text-slate-400">distinct sources</span>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Top: {data.bySource.length > 0 ? formatSourceName(data.bySource[0].source) : 'None yet'}
          </div>
        </div>
      </div>

      {/* Metric Transparency Note */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-medium">Analytics Denominator Disclosure: </span>
          Conversion rate (CR%) and Cost per Registration (CAC) are not arbitrarily fabricated. 
          True conversion rates require verified landing page visit impressions (denominators), and accurate CAC requires logged media spend disbursements.
          In this prototype, we display verified registration counts directly backed by SQLite database records.
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Velocity Over Time */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Registration Velocity</h2>
              <p className="text-xs text-slate-400">Trend by registration timestamps</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>

          <div className="h-64 w-full">
            {data.dailyRegistrations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No time-series data yet. Submit a registration to start recording.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)} 
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#regGrad)" 
                    name="Registrations"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Acquisition Channel Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Acquisition Channel Contribution</h2>
              <p className="text-xs text-slate-400">Registrations per channel category</p>
            </div>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            {data.bySource.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No channel data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bySource} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="source" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => formatSourceName(v).split(' ')[0]} 
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => [val, formatSourceName(item.payload.source)]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSourceColor(entry.source)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Graduation Year Distribution & Recent Registrations Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graduation Year Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <h2 className="text-sm font-semibold text-white mb-1">Target Audience Breakdown</h2>
          <p className="text-xs text-slate-400 mb-4">Focus on final-year engineering students</p>

          <div className="space-y-3">
            {data.byGraduationYear.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No records</div>
            ) : (
              data.byGraduationYear.map((item) => {
                const pct = data.totalRegistrations > 0 ? Math.round((item.count / data.totalRegistrations) * 100) : 0;
                const isFinalYear = item.year === 2026 || item.year === 2027;
                return (
                  <div key={item.year} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        Class of {item.year} {isFinalYear && <span className="text-[10px] text-blue-400 ml-1">(Core Target)</span>}
                      </span>
                      <span className="text-slate-400">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${isFinalYear ? 'bg-blue-500' : 'bg-slate-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Registrations Preview */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Latest Verified Registrations</h2>
              <p className="text-xs text-slate-400">Directly persisted in SQLite</p>
            </div>
            <Link
              to="/dashboard/registrations"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/60 border-y border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Student</th>
                  <th className="py-2.5 px-3 font-semibold">College</th>
                  <th className="py-2.5 px-3 font-semibold">Channel</th>
                  <th className="py-2.5 px-3 font-semibold">Referral Used</th>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRegs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No registrations recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentRegs.map((reg) => (
                    <tr key={reg.registration_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">
                        {reg.full_name}
                        <div className="text-[10px] text-slate-500 font-mono">{reg.registration_id}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {reg.college}
                        <div className="text-[10px] text-slate-500">{reg.branch} ('{reg.graduation_year.toString().slice(2)})</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span 
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${getSourceColor(reg.acquisition_source)}15`,
                            color: getSourceColor(reg.acquisition_source),
                            border: `1px solid ${getSourceColor(reg.acquisition_source)}30`
                          }}
                        >
                          {formatSourceName(reg.acquisition_source)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {reg.referral_code_used || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {formatDate(reg.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
