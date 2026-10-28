import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Copy, Check, Cpu, ArrowRight, Share2 } from 'lucide-react';
import { useState } from 'react';
import { buildReferralUrl, copyToClipboard } from '../lib/utils';

export default function SuccessPage() {
  const location = useLocation();
  const state = location.state as {
    registrationId?: string;
    referralCode?: string;
    fullName?: string;
  } | null;

  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!state?.registrationId) {
    return <Navigate to="/register" replace />;
  }

  const referralUrl = buildReferralUrl(state.referralCode!);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(referralUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(state.referralCode!);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-navy-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-navy-900">AI Workshop</span>
          </Link>
        </div>
      </header>

      <main className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            You're Registered!
          </h1>
          <p className="text-navy-600 mb-2">
            Welcome{state.fullName ? `, ${state.fullName.split(' ')[0]}` : ''}! Your spot is confirmed.
          </p>
          <p className="text-sm text-navy-500 mb-8">
            Registration ID: <code className="px-2 py-0.5 bg-navy-100 rounded text-navy-700 font-mono text-xs">{state.registrationId}</code>
          </p>

          {/* Referral Section */}
          <div className="bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 text-left shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-accent-600" />
              <h2 className="font-semibold text-navy-900">Invite your classmates</h2>
            </div>
            <p className="text-sm text-navy-600 mb-5">
              Share this link with friends who'd benefit from the workshop. When they register using your link, it'll be tracked to your referral.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-navy-500 mb-1.5">Your Referral Code</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2.5 bg-navy-50 rounded-lg border border-navy-200 font-mono text-sm text-navy-800 truncate">
                  {state.referralCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2.5 rounded-lg border border-navy-200 hover:bg-navy-50 transition-colors text-navy-600"
                  aria-label="Copy referral code"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1.5">Your Referral Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 px-3 py-2.5 bg-navy-50 rounded-lg border border-navy-200 text-sm text-navy-700 truncate"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 transition-colors flex items-center gap-1.5 shrink-0"
                  aria-label="Copy referral link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-navy-200 text-navy-700 font-medium rounded-xl hover:bg-navy-50 transition-colors text-sm"
            >
              Back to Home
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 bg-navy-900 text-white font-medium rounded-xl hover:bg-navy-800 transition-colors text-sm flex items-center justify-center gap-2"
            >
              View Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-8 text-xs text-navy-400">
            This is a prototype. No actual workshop communication will be sent.
          </p>
        </div>
      </main>
    </div>
  );
}
