import { 
  FlaskConical, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Clock
} from 'lucide-react';

export default function ExperimentsPage() {
  const experiments = [
    {
      id: 'EXP-01',
      title: 'Landing Page Headline: Concrete Project vs Skill Promise',
      status: 'Planned',
      hypothesis: 'Focusing on "Build a Working AI Project in 60 Minutes" will yield higher registration conversion than an abstract skill headline ("Master Modern Generative AI Fundamentals") because final-year students prioritize tangible interview portfolio artifacts.',
      variable: 'Headline Copy & Hero Subtext (A/B Test via URL query ?v=project vs ?v=skill)',
      metric: 'Landing Page Conversion Rate (Registrations / Unique Hero Impressions)',
      sampleSize: 'Minimum 150 unique visits per variant with 95% statistical confidence',
      decisionRule: 'If the project-outcome variant demonstrates a ≥15% relative lift with p < 0.05, adopt it permanently across all campaign distribution channels; otherwise revert to control.',
    },
    {
      id: 'EXP-02',
      title: 'Community Outreach Copy: Project Demo vs Curriculum Syllabus',
      status: 'Planned',
      hypothesis: 'Forwardable WhatsApp messages showcasing an actual project preview (e.g., "Build an AI Text Summarizer in 45m") will achieve higher link click-through and registration rates from college groups compared to a list of technical topics/syllabus.',
      variable: 'WhatsApp Message Format (Outcome Preview with GIF/ASCII card vs Topic Bullet List)',
      metric: 'UTM Click-Through Rate & Completed Registrations per outreach push',
      sampleSize: 'Tested across 10 matched engineering college WhatsApp groups (5 per variant)',
      decisionRule: 'If the outcome-preview format drives ≥25% more verified registrations by Day 4, standardise it for all Class Representative forwarding packets for Days 5–7.',
    },
    {
      id: 'EXP-03',
      title: 'Distribution Channel: Community Broadcast vs Peer Referral Loop',
      status: 'Planned',
      hypothesis: 'Peer referrals will yield higher attendee commitment and lower drop-off than broadcast community posts because peer recommendation carries higher social validation among final-year batchmates.',
      variable: 'Attribution Channel (?utm_source=whatsapp broadcast vs ?ref=peer referral)',
      metric: 'Ratio of peer-referred registrations and verification rates',
      sampleSize: 'Minimum 50 registrations acquired via each channel',
      decisionRule: 'If peer referrals demonstrate a referral coefficient (k-factor) > 0.25, allocate Day 5 and Day 6 outreach effort towards encouraging registered students to invite study partners.',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Growth Strategy & Experiment Matrix
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Structured behavioral hypotheses, student psychology analysis, and decision frameworks.
          </p>
        </div>
      </div>

      {/* Student Psychology Analysis (Section 9) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <BrainCircuit className="w-4 h-4" />
            Primary Audience
          </div>
          <h2 className="text-sm font-bold text-white">Final-Year Engineers</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Students in 7th/8th semesters across CSE, IT, ECE, and allied branches preparing for campus placements, off-campus hiring, or final-year mini-projects.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            Core Motivation
          </div>
          <h2 className="text-sm font-bold text-white">Tangible Project Proof</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need real, demonstrable AI projects for resumes and interviews. Tired of purely theoretical lectures without working output.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Key Friction Points
          </div>
          <h2 className="text-sm font-bold text-white">Time & Difficulty Fear</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Worry that AI requires advanced calculus or huge GPUs. Saturated by spam webinars that turn into sales pitches.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Strategic Response
          </div>
          <h2 className="text-sm font-bold text-white">Low-Friction Promise</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clear 60-minute timebox, 100% free with zero upsell, concrete example outcome ("Text Summarizer"), and minimal registration fields.
          </p>
        </div>
      </div>

      {/* Planned Experiments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            Testable Growth Experiments
          </h2>
          <span className="text-xs text-slate-400">
            Pre-registered decision protocols
          </span>
        </div>

        <div className="space-y-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {exp.id}
                  </span>
                  <h3 className="text-sm font-bold text-white">{exp.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Status: {exp.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-800/40 p-3.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block">Hypothesis</span>
                  <p className="text-slate-400 leading-relaxed">{exp.hypothesis}</p>
                </div>

                <div className="space-y-1 bg-slate-800/40 p-3.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block">Tested Variable</span>
                  <p className="text-slate-400 leading-relaxed">{exp.variable}</p>
                </div>

                <div className="space-y-1 bg-slate-800/40 p-3.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block">Success Metric & Required Evidence</span>
                  <p className="text-slate-400 leading-relaxed">
                    <strong>Primary Metric:</strong> {exp.metric}<br />
                    <strong>Evidence Threshold:</strong> {exp.sampleSize}
                  </p>
                </div>

                <div className="space-y-1 bg-slate-800/40 p-3.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-emerald-400 block">Decision Rule</span>
                  <p className="text-slate-400 leading-relaxed">{exp.decisionRule}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclosure Footer */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 text-xs text-slate-500 rounded-xl flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Scientific Rigor Disclosure:</strong> Growth experiments are marked as <em>"Planned"</em> in this prototype. 
          To prevent misleading claims, conclusions will only be published when sufficient independent traffic and verified conversion records are logged under controlled testing conditions.
        </p>
      </div>
    </div>
  );
}
