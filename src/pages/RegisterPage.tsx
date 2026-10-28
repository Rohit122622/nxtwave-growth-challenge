import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cpu, ArrowLeft, Loader2 } from 'lucide-react';
import { registerStudent, ApiError, trackReferralClick } from '../lib/api';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  college: z.string().min(2, 'College name is required').max(200),
  graduationYear: z.string().refine(
    (v) => { const n = parseInt(v); return n >= 2024 && n <= 2030; },
    'Please select a valid graduation year'
  ),
  branch: z.string().min(2, 'Branch or degree is required').max(100),
  referralCode: z.string().max(20).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refCode = searchParams.get('ref') || '';
  const utmSource = searchParams.get('utm_source') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';

  // Track referral click
  useEffect(() => {
    if (refCode) {
      trackReferralClick(refCode).catch(() => {});
    }
  }, [refCode]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      college: '',
      graduationYear: '2027',
      branch: '',
      referralCode: refCode,
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await registerStudent({
        fullName: data.fullName,
        email: data.email,
        college: data.college,
        graduationYear: data.graduationYear,
        branch: data.branch,
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
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          for (const d of err.details) {
            const field = d.field as keyof FormData;
            if (field in schema.shape) {
              setError(field, { message: d.message });
            }
          }
        }
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-3 rounded-lg border text-navy-900 bg-white placeholder:text-navy-400 text-sm transition-colors focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-navy-200 hover:border-navy-300'
    }`;

  return (
    <div className="min-h-screen bg-warm-50">
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
        </div>
      </header>

      <main className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">
              Register for the Workshop
            </h1>
            <p className="text-navy-600">
              Build Your First AI Project in 60 Minutes — free and online.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 shadow-sm">
            {serverError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-navy-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('fullName')}
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  className={inputClass('fullName')}
                  autoComplete="name"
                />
                {errors.fullName && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass('email')}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="college" className="block text-sm font-medium text-navy-700 mb-1.5">
                  College / University <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('college')}
                  id="college"
                  type="text"
                  placeholder="e.g. IIT Hyderabad"
                  className={inputClass('college')}
                />
                {errors.college && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.college.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-navy-700 mb-1.5">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('graduationYear')}
                    id="graduationYear"
                    className={inputClass('graduationYear')}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.graduationYear && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.graduationYear.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-navy-700 mb-1.5">
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
                    <p className="mt-1.5 text-xs text-red-600">{errors.branch.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-navy-700 mb-1.5">
                  Referral Code <span className="text-navy-400 font-normal">(optional)</span>
                </label>
                <input
                  {...register('referralCode')}
                  id="referralCode"
                  type="text"
                  placeholder="Enter referral code if you have one"
                  className={inputClass('referralCode')}
                />
                {errors.referralCode && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.referralCode.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                id="submit-registration"
                className="w-full py-3.5 bg-accent-600 text-white font-semibold rounded-xl hover:bg-accent-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register for Free'
                )}
              </button>
            </form>

            <p className="mt-5 text-xs text-navy-400 text-center leading-relaxed">
              This is a prototype demo. Your information is stored locally on this device for demonstration purposes only.
              No emails will be sent. Data is not shared with third parties.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
