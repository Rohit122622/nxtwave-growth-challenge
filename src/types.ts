export interface Registration {
  registration_id: string;
  full_name: string;
  email?: string;
  college: string;
  graduation_year: number;
  branch: string;
  acquisition_source: string;
  referral_code_used: string | null;
  own_referral_code: string;
  created_at: string;
}

export interface RegistrationForm {
  fullName: string;
  email: string;
  college: string;
  graduationYear: string;
  branch: string;
  referralCode?: string;
  acquisitionSource?: string;
}

export interface AnalyticsOverview {
  totalRegistrations: number;
  target: number;
  progress: number;
  bySource: { source: string; count: number }[];
  referralRegistrations: number;
  dailyRegistrations: { date: string; count: number }[];
  byGraduationYear: { year: number; count: number }[];
  isDemo: boolean;
}

export interface RegistrationListResponse {
  registrations: Registration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isDemo: boolean;
}

export interface ChannelData {
  id: number;
  channel: string;
  target_registrations: number;
  planned_activities: string;
  budget_allocation: number;
  owner: string;
  success_metric: string;
  status: string;
  sort_order: number;
  actual_registrations: number;
  progress: number;
}

export interface ChannelsResponse {
  channels: ChannelData[];
  rawSources: { source: string; count: number }[];
  isDemo: boolean;
}

export interface ReferrerData {
  code: string;
  referrer_name: string;
  referral_count: number;
}

export interface ReferralAnalytics {
  referrers: ReferrerData[];
  clicks: { code: string; click_count: number }[];
  totalReferralRegistrations: number;
  totalClicks: number;
  isDemo: boolean;
}

export interface CampaignConfig {
  id: number;
  channel: string;
  target_registrations: number;
  planned_activities: string;
  budget_allocation: number;
  owner: string;
  success_metric: string;
  status: string;
  sort_order: number;
}

export type DataMode = 'live' | 'demo';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'student' | 'admin';
  status?: string;
}

export interface StudentDashboardResponse {
  hasRegistration: boolean;
  student?: {
    registrationId?: string;
    fullName: string;
    email: string;
    college?: string;
    graduationYear?: number;
    branch?: string;
    ownReferralCode?: string;
    referralCodeUsed?: string | null;
    acquisitionSource?: string;
    createdAt?: string;
  };
  referrals?: {
    totalReferred: number;
    totalClicks: number;
  };
}
