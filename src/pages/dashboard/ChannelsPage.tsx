import { useState, useEffect } from 'react';
import { 
  Layers, 
  Target, 
  TrendingUp, 
  Edit2, 
  Check, 
  X,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';
import { getChannelAnalytics, updateCampaignConfig } from '../../lib/api';
import { useDataMode } from '../../contexts/DataModeContext';
import { LoadingSpinner, ErrorState } from '../../components/ui/States';
import { formatSourceName, getSourceColor } from '../../lib/utils';
import type { ChannelData } from '../../types';

export default function ChannelsPage() {
  const { isDemo, refreshKey, refresh } = useDataMode();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline editing state for targets
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadChannels() {
      setLoading(true);
      setError(null);
      try {
        const res = await getChannelAnalytics(isDemo);
        if (mounted) {
          setChannels(res.channels);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load channels');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadChannels();
    return () => { mounted = false; };
  }, [isDemo, refreshKey]);

  const handleStartEdit = (ch: ChannelData) => {
    setEditingId(ch.id);
    setEditTarget(ch.target_registrations);
  };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    try {
      await updateCampaignConfig(id, { target_registrations: Number(editTarget) });
      setEditingId(null);
      refresh();
    } catch (err: any) {
      alert('Failed to update target: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Calculating channel attribution..." />;
  if (error) return <ErrorState message={error} />;

  const totalTarget = channels.reduce((sum, c) => sum + (c.target_registrations || 0), 0);
  const totalActual = channels.reduce((sum, c) => sum + (c.actual_registrations || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100 * 10) / 10 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Acquisition Channels
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Performance comparison of growth channels against planned targets.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Target</span>
            <span className="text-white font-bold text-base">{totalTarget}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Actual</span>
            <span className="text-blue-400 font-bold text-base">{totalActual}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Attainment</span>
            <span className="text-emerald-400 font-bold text-base">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Target Balance Alert */}
      {totalTarget !== 500 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Note: The current channel targets sum to <strong>{totalTarget}</strong> (original 7-day plan hypothesis was 500). Click the edit icon to adjust individual channel targets.</span>
        </div>
      )}

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => {
          const progress = ch.target_registrations > 0 
            ? Math.min(100, Math.round((ch.actual_registrations / ch.target_registrations) * 100))
            : 0;
          const isEditing = editingId === ch.id;

          return (
            <div 
              key={ch.id} 
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-white tracking-tight leading-snug">
                    {ch.channel}
                  </h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 uppercase tracking-wider ${
                    ch.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {ch.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2" title={ch.planned_activities}>
                  {ch.planned_activities}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target Progress</span>
                    <span className="font-semibold text-white">{ch.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Actual</span>
                    <span className="text-white font-bold text-sm">{ch.actual_registrations}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Target</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(parseInt(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 bg-slate-900 border border-blue-500 rounded text-xs text-white"
                        />
                        <button
                          onClick={() => handleSaveEdit(ch.id)}
                          disabled={saving}
                          className="p-1 text-emerald-400 hover:text-white"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 font-bold text-sm">{ch.target_registrations}</span>
                        <button
                          onClick={() => handleStartEdit(ch)}
                          className="text-slate-500 hover:text-blue-400 p-0.5"
                          title="Edit target"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Owner: <strong>{ch.owner}</strong></span>
                <span>Budget: ₹{ch.budget_allocation}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attribution Logic Details */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Acquisition Source Attribution Mapping
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Attribution is determined deterministically during registration processing:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <span className="text-blue-400 font-medium">1. Referral Code Attribution:</span>
            <p className="text-slate-400 mt-1">If a valid referral code is provided during registration, attribution automatically maps to <code>Student Referrals</code>.</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <span className="text-indigo-400 font-medium">2. UTM Parameter Attribution:</span>
            <p className="text-slate-400 mt-1">When students click campaign links containing <code>?utm_source=whatsapp</code>, <code>classrep</code>, or <code>techclub</code>, attribution is linked to that specific outreach channel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
