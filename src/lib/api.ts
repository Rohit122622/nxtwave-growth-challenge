import type {
  AnalyticsOverview,
  RegistrationListResponse,
  ChannelsResponse,
  ReferralAnalytics,
  CampaignConfig,
  User,
  StudentDashboardResponse,
} from '../types';

const BASE = '/api';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

let cachedCsrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  const cookieVal = getCookie('csrf_token');
  if (cookieVal) {
    cachedCsrfToken = cookieVal;
    return cookieVal;
  }
  try {
    const res = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
    const data = await res.json();
    cachedCsrfToken = data.csrfToken;
    return data.csrfToken;
  } catch {
    return '';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // Attach CSRF token on mutation requests
  const method = (options?.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrf = getCookie('csrf_token') || cachedCsrfToken;
    if (csrf) {
      headers['x-csrf-token'] = csrf;
    } else {
      const fetched = await fetchCsrfToken();
      if (fetched) headers['x-csrf-token'] = fetched;
    }
  }

  const res = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status, body.details);
  }
  return res.json();
}

export class ApiError extends Error {
  status: number;
  details?: { field: string; message: string }[];
  constructor(message: string, status: number, details?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// ========== AUTHENTICATION APIS ==========

export async function getAuthUser(): Promise<User | null> {
  try {
    const res = await request<{ user: User | null }>('/auth/me');
    return res.user;
  } catch {
    return null;
  }
}

export async function studentSignup(data: {
  fullName: string;
  email: string;
  college: string;
  graduationYear: string;
  branch: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  acquisitionSource?: string;
  utmSource?: string;
  utmCampaign?: string;
}) {
  return request<{
    message: string;
    user: User;
    registrationId: string;
    referralCode: string;
  }>('/auth/student/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function studentLogin(credentials: { email: string; password: string }) {
  return request<{ message: string; user: User }>('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function adminLogin(credentials: { email: string; password: string }) {
  return request<{ message: string; user: User }>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logoutUser() {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}

export async function changePassword(passwords: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(passwords),
  });
}

export async function requestAccountClaim(email: string) {
  return request<{ message: string; developmentNotice?: string }>('/auth/claim/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function completeAccountClaim(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return request<{ message: string; user: User }>('/auth/claim/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ========== STUDENT PORTAL APIS ==========

export async function getStudentProfile(): Promise<StudentDashboardResponse> {
  return request<StudentDashboardResponse>('/student/me');
}

// ========== WORKSHOP REGISTRATION (PRESERVED) ==========

export async function registerStudent(data: {
  fullName: string;
  email: string;
  college: string;
  graduationYear: string;
  branch: string;
  password?: string;
  referralCode?: string;
  acquisitionSource?: string;
  utmSource?: string;
  utmCampaign?: string;
}) {
  return request<{ registrationId: string; referralCode: string; message: string }>(
    '/register',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

// ========== REFERRAL APIS ==========

export async function trackReferralClick(code: string) {
  return request<{ tracked: boolean }>('/referral-click', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function validateReferralCode(code: string) {
  return request<{ valid: boolean }>(`/referral/${encodeURIComponent(code)}/validate`);
}

// ========== ADMIN ANALYTICS APIS ==========

export async function getAnalyticsOverview(demo: boolean) {
  return request<AnalyticsOverview>(`/analytics/overview?demo=${demo}`);
}

export async function getRegistrations(params: {
  demo: boolean;
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
}) {
  const qs = new URLSearchParams({
    demo: String(params.demo),
    page: String(params.page || 1),
    limit: String(params.limit || 20),
  });
  if (params.search) qs.set('search', params.search);
  if (params.source) qs.set('source', params.source);
  return request<RegistrationListResponse>(`/analytics/registrations?${qs}`);
}

export async function exportRegistrations(demo: boolean) {
  const res = await fetch(`${BASE}/analytics/export?demo=${demo}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function getChannelAnalytics(demo: boolean) {
  return request<ChannelsResponse>(`/analytics/channels?demo=${demo}`);
}

export async function getReferralAnalytics(demo: boolean) {
  return request<ReferralAnalytics>(`/analytics/referrals?demo=${demo}`);
}

// ========== ADMIN CAMPAIGN CONFIG ==========

export async function getCampaignConfig() {
  return request<{ campaigns: CampaignConfig[] }>('/campaign');
}

export async function updateCampaignConfig(id: number, data: Partial<CampaignConfig>) {
  return request<CampaignConfig>(`/campaign/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ========== ADMIN CLAIM TOKEN ISSUANCE ==========

export async function issueClaimToken(email: string) {
  return request<{
    message: string;
    email: string;
    studentName: string;
    token: string;
    expiresAt: string;
    claimUrl: string;
  }>('/admin/issue-claim-token', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ========== ADMIN DEMO DATA MANAGEMENT ==========

export async function seedDemoData(count = 45) {
  return request<{ message: string; count: number }>('/demo/seed', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
}

export async function clearDemoData() {
  return request<{ message: string }>('/demo/clear', { method: 'DELETE' });
}
