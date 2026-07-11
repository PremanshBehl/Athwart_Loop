// Single source of truth for the Athwart Loop design-system metadata,
// transcribed from the brand-manual mock (Athwart Loop.dc.html). Board,
// detail, profile and campaign views all read from here so colors and
// labels stay consistent.

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', FOUNDER: 'Founder', FRONTEND: 'Frontend',
  BACKEND: 'Backend', DEVOPS: 'DevOps', AI_ML: 'AI / ML',
};

export const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#8018de', FOUNDER: '#6a0fc0', FRONTEND: '#0a6dd8',
  BACKEND: '#1e8f4e', DEVOPS: '#f15d24', AI_ML: '#c79000',
};

export const SECTION_LABEL: Record<string, string> = {
  BILLS: 'Bills', INVOICING: 'Invoicing', PATIENTS: 'Patients', CASES: 'Cases',
  PARTNERS: 'Partners', HOSPITALS: 'Hospitals', DOCTORS: 'Doctors',
  WHATSAPP: 'WhatsApp', PLATFORM: 'Platform', GENERAL: 'General',
};

export const SECTIONS = [
  'BILLS', 'INVOICING', 'PATIENTS', 'CASES', 'PARTNERS',
  'HOSPITALS', 'DOCTORS', 'WHATSAPP', 'PLATFORM', 'GENERAL',
] as const;

export const TYPE_META: Record<string, { label: string; color: string; bg: string; hint: string }> = {
  QUESTION: { label: 'Question', color: '#0a6dd8', bg: '#e7f0fc', hint: 'Ask the team' },
  PROBLEM:  { label: 'Problem',  color: '#f15d24', bg: '#fdece4', hint: 'Something is broken' },
  IDEA:     { label: 'Idea',     color: '#8018de', bg: '#ede3ff', hint: 'Propose something new' },
};

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:       { label: 'Open',       color: '#c79000', bg: '#fff6df' },
  DISCUSSING: { label: 'Discussing', color: '#0a6dd8', bg: '#e7f0fc' },
  RESOLVED:   { label: 'Resolved',   color: '#1e8f4e', bg: '#e9f8ef' },
};

export const SLA_META: Record<string, { label: string; color: string }> = {
  HEALTHY:  { label: 'On track', color: '#1e8f4e' },
  AT_RISK:  { label: 'At risk',  color: '#c79000' },
  BREACHED: { label: 'Breached', color: '#f15d24' },
};

export const RESOLUTIONS = ['ANSWERED', 'FIXED', 'APPROVED', 'PARKED', 'DECLINED', 'DUPLICATE', 'RULE_DECIDED'] as const;
export const RES_LABEL: Record<string, string> = {
  ANSWERED: 'Answered', FIXED: 'Fixed', APPROVED: 'Approved', PARKED: 'Parked',
  DECLINED: 'Declined', DUPLICATE: 'Duplicate', RULE_DECIDED: 'Rule decided',
};

export const initialsOf = (name?: string): string =>
  (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Deterministic fallback avatar color when a user has no role color.
const PALETTE = ['#8018de', '#0a6dd8', '#1e8f4e', '#f15d24', '#c79000', '#6a0fc0', '#0f9b91'];
export const avatarColor = (role?: string, id?: number): string =>
  (role && ROLE_COLOR[role]) || PALETTE[(id ?? 0) % PALETTE.length];

export const relativeTime = (input: string | number | Date): string => {
  const ts = new Date(input).getTime();
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};
