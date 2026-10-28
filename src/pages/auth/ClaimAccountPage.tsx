import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cpu, ArrowLeft, Loader2, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { requestAccountClaim, completeAccountClaim, ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const requestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const completeSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-zA-Z]/, 'Must contain letters')
      .regex(/\d/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RequestFormData = z.infer<typeof requestSchema>;
type CompleteFormData = z.infer<typeof completeSchema>;

export default function ClaimAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const token = searchParams.get('token');

  const [requested, setRequested] = useState(false);
  const [devNotice, setDevNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const requestForm = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  });

  const completeForm = useForm<CompleteFormData>({
    resolver: zodResolver(completeSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onRequestSubmit = async (data: RequestFormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await requestAccountClaim(data.email);
      setRequested(true);
      if (res.developmentNotice) {
        setDevNotice(res.developmentNotice);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to request account claim.');
    } finally {
      setLoading(false);
    }
  };

  const onCompleteSubmit = async (data: CompleteFormData) => {
    if (!token) return;
    setServerError(null);
    setLoading(true);
    try {
      await completeAccountClaim({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      await refreshUser();
      navigate('/student/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Failed to activate account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="bg-white border-b border-navy-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-navy-600 hover:text-navy-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-navy-900">AI Workshop</span>
            </div>
          </Link>
          <Link to="/login" className="text-xs text-navy-600 font-medium">
            Back to Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
              {token ? 'Activate Your Account' : 'Claim Existing Registration'}
            </h1>
            <p className="text-sm text-navy-600">
              {token
                ? 'Create a secure password to activate your personal student portal.'
                : 'Registered before authentication was introduced? Link your spot to a new password.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-5">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {token ? (
              // Step 2: Set password with token
              <form onSubmit={completeForm.handleSubmit(onCompleteSubmit)} noValidate className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Activation token verified. Choose a strong password.</span>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...completeForm.register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters (letters + numbers)"
                      className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {completeForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {completeForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    {...completeForm.register('confirmPassword')}
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type password"
                    className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  {completeForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {completeForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating Account...
                    </>
                  ) : (
                    'Set Password & Open Dashboard'
                  )}
                </button>
              </form>
            ) : requested ? (
              // Step 1 Completed Notice
              <div className="space-y-4 text-center py-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h2 className="text-base font-bold text-navy-900">Claim Request Registered</h2>
                <p className="text-xs text-navy-600 leading-relaxed">
                  If your email matches an existing workshop registration that does not yet have a password, an activation procedure has been recorded.
                </p>
                {devNotice && (
                  <div className="p-3 bg-navy-50 border border-navy-200 rounded-xl text-left text-xs text-navy-700">
                    <span className="font-semibold block text-navy-900 mb-1">Development Environment Note:</span>
                    <p className="text-[11px] text-navy-600">{devNotice}</p>
                    <p className="text-[11px] text-navy-500 mt-1">
                      Admins can issue a direct activation link via the Growth Dashboard or run <code className="bg-navy-200/60 px-1 py-0.5 rounded">npm test</code>.
                    </p>
                  </div>
                )}
                <Link
                  to="/login"
                  className="inline-block px-4 py-2 text-xs font-semibold text-accent-600 hover:text-accent-700"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              // Step 1: Request claim by email
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    Your Registered Email
                  </label>
                  <input
                    {...requestForm.register('email')}
                    id="email"
                    type="email"
                    placeholder="Enter the email used during workshop registration"
                    className="w-full px-4 py-2.5 rounded-xl border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                  {requestForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {requestForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Registration...
                    </>
                  ) : (
                    'Verify Registration & Request Activation'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-navy-400 border-t border-navy-100 bg-white">
        NxtWave AI Workshop Prototype &middot; Secure High-Entropy Account Activation
      </footer>
    </div>
  );
}
