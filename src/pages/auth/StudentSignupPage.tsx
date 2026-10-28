import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cpu, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    college: z.string().min(2, 'College name is required').max(200),
    graduationYear: z.string().refine(
      (v) => { const n = parseInt(v); return n >= 2024 && n <= 2030; },
      'Please select a valid graduation year'
    ),
    branch: z.string().min(2, 'Branch or degree is required').max(100),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-zA-Z]/, 'Must contain letters')
      .regex(/\d/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    referralCode: z.string().max(20).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function StudentSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signupStudent } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refCode = searchParams.get('ref') || '';
  const utmSource = searchParams.get('utm_source') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      college: '',
      graduationYear: '2027',
      branch: '',
      password: '',
      confirmPassword: '',
      referralCode: refCode,
    },
  });

  const pwd = watch('password') || '';
  const hasMinLength = pwd.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /\d/.test(pwd);
  const strengthScore = (hasMinLength ? 1 : 0) + (hasLetters ? 1 : 0) + (hasNumbers ? 1 : 0);

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await signupStudent({
        fullName: data.fullName,
        email: data.email,
        college: data.college,
        graduationYear: data.graduationYear,
        branch: data.branch,
        password: data.password,
        confirmPassword: data.confirmPassword,
        referralCode: data.referralCode || undefined,
        utmSource: utmSource || undefined,
        utmCampaign: utmCampaign || undefined,
      });

      navigate('/success', {
        state: {
          registrationId: result.registrationId,
          referralCode: result.referralCode,
          fullName: data.fullName,
        },
        replace: true,
      });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.details) {
          for (const d of err.details) {
            const field = d.field as keyof SignupFormData;
            if (field) setError(field, { message: d.message });
          }
        }
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred during signup. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof SignupFormData) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm text-navy-900 bg-white placeholder:text-navy-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-navy-200 hover:border-navy-300'
    }`;

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
          <div className="text-xs text-navy-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-accent-600 hover:text-accent-700">
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 py-10 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
              Create Student Account
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Confirm your free workshop spot and establish your personal student dashboard credentials.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 shadow-sm space-y-5">
            {serverError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5" role="alert">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p>{serverError}</p>
                  {serverError.includes('already exists') && (
                    <Link to="/login" className="underline font-semibold mt-1 inline-block text-red-800">
                      Click here to sign in with your password
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Name & Email */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('fullName')}
                  id="fullName"
                  type="text"
                  placeholder="e.g. Ananya Krishnan"
                  autoComplete="name"
                  className={inputClass('fullName')}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="ananya@example.com"
                  autoComplete="email"
                  className={inputClass('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* College, Grad Year, Branch */}
              <div>
                <label htmlFor="college" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                  College / University <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('college')}
                  id="college"
                  type="text"
                  placeholder="e.g. NIT Warangal"
                  className={inputClass('college')}
                />
                {errors.college && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.college.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="graduationYear" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('graduationYear')}
                    id="graduationYear"
                    className={inputClass('graduationYear')}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>Class of {y}</option>
                    ))}
                  </select>
                  {errors.graduationYear && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.graduationYear.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="branch" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    Branch / Degree <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('branch')}
                    id="branch"
                    type="text"
                    placeholder="e.g. Computer Science"
                    className={inputClass('branch')}
                  />
                  {errors.branch && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.branch.message}</p>
                  )}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                      className={inputClass('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type password"
                    autoComplete="new-password"
                    className={inputClass('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Password Strength Guidance */}
              <div className="p-3 bg-navy-50/70 border border-navy-100 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-navy-600 font-medium">
                  <span>Password Security:</span>
                  <span className={strengthScore === 3 ? 'text-emerald-600 font-bold' : strengthScore === 2 ? 'text-amber-600' : 'text-red-500'}>
                    {strengthScore === 3 ? 'Strong' : strengthScore === 2 ? 'Moderate' : 'Weak'}
                  </span>
                </div>
                <div className="w-full bg-navy-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      strengthScore === 3 ? 'bg-emerald-500' : strengthScore === 2 ? 'bg-amber-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${(strengthScore / 3) * 100}%` }}
                  />
                </div>
                <div className="flex gap-4 text-[10px] text-navy-500 pt-0.5">
                  <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : ''}`}>
                    <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-navy-300'}`} />
                    8+ chars
                  </span>
                  <span className={`flex items-center gap-1 ${hasLetters ? 'text-emerald-700 font-semibold' : ''}`}>
                    <Check className={`w-3 h-3 ${hasLetters ? 'text-emerald-600' : 'text-navy-300'}`} />
                    Letters
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumbers ? 'text-emerald-700 font-semibold' : ''}`}>
                    <Check className={`w-3 h-3 ${hasNumbers ? 'text-emerald-600' : 'text-navy-300'}`} />
                    Number (0-9)
                  </span>
                </div>
              </div>

              {/* Referral Code (Optional) */}
              <div>
                <label htmlFor="referralCode" className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                  Referral Code <span className="text-navy-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  {...register('referralCode')}
                  id="referralCode"
                  type="text"
                  placeholder="e.g. ROHI9A2F"
                  className={inputClass('referralCode')}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account &amp; Registering...
                  </>
                ) : (
                  'Complete Registration & Sign Up'
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-navy-500">
              By registering, you confirm that your account and registration details are stored securely. No passwords are ever stored in plaintext.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-navy-400 border-t border-navy-100 bg-white">
        NxtWave AI Workshop Prototype &middot; Secure Transactional Registration Engine
      </footer>
    </div>
  );
}
