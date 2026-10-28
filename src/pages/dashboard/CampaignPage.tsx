import { useState, useEffect } from 'react';
import { 
  Calendar, 
  IndianRupee, 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  UserCheck,
  Edit2,
  Check,
  X,
  Layers
} from 'lucide-react';
import { getCampaignConfig, updateCampaignConfig, getChannelAnalytics } from '../../lib/api';
import { useDataMode } from '../../contexts/DataModeContext';
import { LoadingSpinner, ErrorState } from '../../components/ui/States';
import type { CampaignConfig, ChannelData } from '../../types';

export default function CampaignPage() {
  const { isDemo, refreshKey, refresh } = useDataMode();
  const [campaigns, setCampaigns] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable row state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CampaignConfig>>({});
  const [saving, setSaving] = useState(false);

  // Editable budget allocation
  const [budgetItems, setBudgetItems] = useState([
    { name: 'Optional Micro-Paid Channel Test (Meta/Campus Ads)', amount: 1000, desc: 'Highly targeted pilot test on final-year engineering students (only run if permitted channel exists)' },
    { name: 'Creative Assets & Copy Testing Contingency', amount: 500, desc: 'Design iterations, flyer formatting, and contingency outreach costs' },
    { name: 'Unallocated Growth Reserve', amount: 500, desc: 'Strictly held in reserve; not spent unless a proven organic channel requires support' },
  ]);

  useEffect(() => {
    let mounted = true;
    async function loadCampaignData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getChannelAnalytics(isDemo);
        if (mounted) setCampaigns(res.channels);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load campaign data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCampaignData();
    return () => { mounted = false; };
  }, [isDemo, refreshKey]);

  const handleStartEdit = (c: ChannelData) => {
    setEditingId(c.id);
    setEditForm({
      target_registrations: c.target_registrations,
      budget_allocation: c.budget_allocation,
      status: c.status,
      owner: c.owner,
      success_metric: c.success_metric,
    });
  };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    try {
      await updateCampaignConfig(id, editForm);
      setEditingId(null);
      refresh();
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading campaign operations plan..." />;
  if (error) return <ErrorState message={error} />;

  const totalBudgetSpent = budgetItems.reduce((s, i) => s + i.amount, 0);
  const totalPlannedTargets = campaigns.reduce((s, c) => s + (c.target_registrations || 0), 0);
  const totalActual = campaigns.reduce((s, c) => s + (c.actual_registrations || 0), 0);

  const sevenDaySequence = [
    { day: 'Day 1', title: 'Foundation & Asset Readiness', desc: 'Finalize core workshop value proposition, review registration form & tracking attribution (?utm_source & ?ref=), test database endpoints, prepare permission request copy for group admins.' },
    { day: 'Day 2', title: 'Campus Directory & Permission Requests', desc: 'Compile list of target engineering colleges across branches (CSE, IT, ECE, EEE, Mech). Contact Class Representatives (CRs) and coding club leaders for permission prior to posting.' },
    { day: 'Day 3', title: 'Approved Community Outreach Launch', desc: 'Deploy tailored messages to authorized WhatsApp/Discord groups highlighting the concrete outcome: "Build a working AI project in 60 minutes". Enable unique UTM tracking links.' },
    { day: 'Day 4', title: 'Mid-Campaign Attribution Review', desc: 'Review real-time registrations by channel in dashboard. Identify high-converting vs lagging colleges. Tweak messaging for branches with lower response.' },
    { day: 'Day 5', title: 'Student Referral Loop Activation', desc: 'Encourage early registered students to share their personal referral link with classmates. Emphasize learning alongside study partners.' },
    { day: 'Day 6', title: 'Authorized Reminder & Objection Clearing', desc: 'Share project preview ("Text Summarizer in ~45m") to eliminate fear of difficulty. Remind students that basic coding familiarity in any language is sufficient.' },
    { day: 'Day 7', title: 'Final Call & Attendee List Preparation', desc: 'Final registration reminder in authorized channels 6 hours before close. Export verified registration list to CSV with formula injection sanitization.' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            7-Day Growth Campaign & Operations Plan
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Targeting 500 final-year registrations in 7 days within a strict ₹2,000 budget cap.
          </p>
        </div>
      </div>

      {/* ₹2,000 Budget Operations Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              ₹
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Strict ₹2,000 Budget Allocation Hypothesis</h2>
              <p className="text-xs text-slate-400">Prioritizing organic campus distribution; paid spend is purely optional</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Allocated</span>
            <span className={`text-base font-bold ${totalBudgetSpent <= 2000 ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{totalBudgetSpent.toLocaleString()} / ₹2,000
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgetItems.map((item, index) => (
            <div key={index} className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                  <span className="text-sm font-bold text-white shrink-0">₹{item.amount}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-500">
                <span>{index === 2 ? 'Defensive Buffer' : 'Contingent / Test'}</span>
                <span>{Math.round((item.amount / 2000) * 100)}% of total</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Channels Operations Table */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Channel Operations & Targets</h2>
            <p className="text-xs text-slate-400">Total planned targets: <strong>{totalPlannedTargets}</strong> | Actual recorded: <strong>{totalActual}</strong></p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Editable operational table</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/80 border-y border-slate-800">
              <tr>
                <th className="py-3 px-3 font-semibold">Channel</th>
                <th className="py-3 px-3 font-semibold">Target</th>
                <th className="py-3 px-3 font-semibold">Actual</th>
                <th className="py-3 px-3 font-semibold">Owner</th>
                <th className="py-3 px-3 font-semibold">Success Metric</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {campaigns.map((c) => {
                const isEditing = editingId === c.id;

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-white max-w-[200px]">
                      {c.channel}
                      <span className="block text-[10px] text-slate-500 font-normal truncate">{c.planned_activities}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.target_registrations ?? c.target_registrations}
                          onChange={(e) => setEditForm(f => ({ ...f, target_registrations: parseInt(e.target.value) || 0 }))}
                          className="w-16 px-1.5 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                        />
                      ) : (
                        <span className="text-slate-200">{c.target_registrations}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-blue-400">
                      {c.actual_registrations}
                    </td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.owner ?? c.owner}
                          onChange={(e) => setEditForm(f => ({ ...f, owner: e.target.value }))}
                          className="w-28 px-1.5 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                        />
                      ) : (
                        c.owner
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[200px] truncate" title={c.success_metric}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.success_metric ?? c.success_metric}
                          onChange={(e) => setEditForm(f => ({ ...f, success_metric: e.target.value }))}
                          className="w-full px-1.5 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                        />
                      ) : (
                        c.success_metric
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <select
                          value={editForm.status ?? c.status}
                          onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                          className="px-1.5 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                        >
                          <option value="planned">planned</option>
                          <option value="active">active</option>
                          <option value="completed">completed</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                          c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(c.id)}
                            disabled={saving}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(c)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Edit row"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7-Day Sprint Roadmap */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          7-Day Tactical Execution Sequence
        </h2>
        <div className="space-y-3">
          {sevenDaySequence.map((step, idx) => (
            <div key={idx} className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-start gap-3">
              <span className="px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold shrink-0">
                {step.day}
              </span>
              <div>
                <h3 className="text-xs font-semibold text-white mb-0.5">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
