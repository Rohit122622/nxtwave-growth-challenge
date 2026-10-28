export function formatSourceName(source: string): string {
  const map: Record<string, string> = {
    whatsapp: 'WhatsApp Groups',
    class_representative: 'Class Representatives',
    tech_club: 'Tech Clubs',
    referral: 'Student Referrals',
    organic: 'Organic/Email',
    direct: 'Direct',
  };
  return map[source] || source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    whatsapp: '#22c55e',
    class_representative: '#3b82f6',
    tech_club: '#8b5cf6',
    referral: '#f59e0b',
    organic: '#06b6d4',
    direct: '#6b7280',
  };
  return colors[source] || '#94a3b8';
}

export function getChartColors(): string[] {
  return ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899'];
}

export function getUrlParams(): { utmSource?: string; utmCampaign?: string; ref?: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    ref: params.get('ref') || undefined,
  };
}

export function buildReferralUrl(code: string): string {
  const base = window.location.origin;
  return `${base}/register?ref=${code}&utm_source=referral&utm_campaign=ai_workshop`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
