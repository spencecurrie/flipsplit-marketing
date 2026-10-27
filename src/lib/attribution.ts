// Where a visitor came from, for the lead row.
//
// SiteAnalytics.astro records the ad-click parameters (utm_*, gclid) on every
// page view into localStorage under this key, and the address modal
// (AddressForm) copies them onto the qualification_sessions row it creates.
// The column list matches migration 0073 in flipsplit-app; sync-attio turns it
// into "Lead source" in the CRM.
//
// Last paid click wins, a plain visit never overwrites a stored click, and a
// record older than 90 days is ignored (Google's own click window).
export const ATTRIBUTION_KEY = 'flipsplit:attribution';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const FIELDS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'landing_page', 'referrer', 'attribution_captured_at',
] as const;

export type Attribution = Partial<Record<(typeof FIELDS)[number], string>>;

// Only the known columns, only strings, only if still fresh — so a stale or
// hand-edited localStorage value can never break the insert.
export function readAttribution(): Attribution {
  try {
    const raw = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return {};
    const at = Date.parse(raw.attribution_captured_at || '');
    if (!Number.isFinite(at) || Date.now() - at > MAX_AGE_MS) return {};
    const out: Attribution = {};
    for (const k of FIELDS) {
      const v = raw[k];
      if (typeof v === 'string' && v) out[k] = v.slice(0, k === 'landing_page' || k === 'referrer' ? 1000 : 200);
    }
    return out;
  } catch {
    return {};
  }
}
