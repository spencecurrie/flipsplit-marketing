// Where a visitor came from, for the lead row.
//
// SiteAnalytics.astro records the ad-click parameters (utm_*, gclid, fbclid) on every
// page view into localStorage under this key, and the address modal
// (AddressForm) copies them onto the qualification_sessions row it creates.
// The column list matches migrations 0073 + 0076 in flipsplit-app; sync-attio turns it
// into "Lead source" in the CRM.
//
// Last paid click wins, a plain visit never overwrites a stored click, and a
// record older than 90 days is ignored (Google's own click window).
export const ATTRIBUTION_KEY = 'flipsplit:attribution';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const FIELDS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'fbclid', 'landing_page', 'referrer', 'attribution_captured_at',
] as const;

const LIMITS: Partial<Record<(typeof FIELDS)[number], number>> = { landing_page: 1000, referrer: 1000, fbclid: 500 };

export type Attribution = Partial<Record<(typeof FIELDS)[number] | 'fbp' | 'fbc', string>>;

function cookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

// Only the known columns, only strings, only if still fresh — so a stale or
// hand-edited localStorage value can never break the insert.
//
// Also picks up Meta's two cookies at this moment (0076): _fbp identifies the
// browser, _fbc the ad click. The pixel sets them on .flipsplit.com; when the
// pixel isn't loaded (previews, blockers) _fbc is rebuilt from the stored
// fbclid in Meta's documented format so the server-side event can still be
// matched to the click.
export function readAttribution(): Attribution {
  try {
    const raw = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return {};
    const at = Date.parse(raw.attribution_captured_at || '');
    if (!Number.isFinite(at) || Date.now() - at > MAX_AGE_MS) return {};
    const out: Attribution = {};
    for (const k of FIELDS) {
      const v = raw[k];
      if (typeof v === 'string' && v) out[k] = v.slice(0, LIMITS[k] ?? 200);
    }
    try {
      const fbp = cookie('_fbp');
      const fbc = cookie('_fbc') || (out.fbclid ? `fb.1.${at}.${out.fbclid}` : null);
      if (fbp) out.fbp = fbp.slice(0, 200);
      if (fbc) out.fbc = fbc.slice(0, 600);
    } catch { /* cookies blocked */ }
    return out;
  } catch {
    return {};
  }
}
