import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cpu, ArrowLeft, Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginStudent } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/student/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setLoading(true);
    try {
      await loginStudent(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="bg-white border-b border-navy-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-navy-600 hover:text-navy-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-navy-900">AI Workshop</span>
            </div>
          </Link>
          <Link
            to="/admin/login"
            className="text-xs text-navy-500 hover:text-navy-800 font-medium transition-colors"
          >
            Growth Ops Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
              Student Login
            </h1>
            <p className="text-sm text-navy-600 mt-1.5">
              Access your workshop registration, referral link, and resources.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-5">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-navy-200 bg-white'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/claim-account"
                    className="text-xs text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Activate account / Claim?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-navy-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-navy-200 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
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
                    Signing in...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-navy-100 text-center text-xs text-navy-600">
              New to the workshop?{' '}
              <Link to="/signup" className="text-accent-600 font-semibold hover:text-accent-700">
                Register & Create Account &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-navy-400 border-t border-navy-100 bg-white">
        Prototype Security System &middot; Protected with HTTP-Only Cookie Sessions &amp; CSRF Defense
      </footer>
    </div>
  );
}
