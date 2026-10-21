// Which qualification_sessions row the /offer/* funnel is working on.
//
// Set by the address modal (AddressForm) when it creates or resumes a row, read
// by OfferLayout. Without it the funnel guessed "the newest unfinished row",
// which is wrong as soon as a visitor has more than one draft — e.g. they
// resume an older address.
export const FUNNEL_SESSION_KEY = 'flipsplit:funnelSessionId';

export function readFunnelSessionId(): string | null {
  try { return localStorage.getItem(FUNNEL_SESSION_KEY); } catch { return null; }
}

// The step page to land on for a row whose last completed step is `step`:
// a fresh row starts at step 1; a resumed one continues after its last answer.
export function resumeHref(step: number | null | undefined): string {
  const next = Math.min(Math.max((step ?? 0) + 1, 1), 7);
  return `/offer/step-${next}/`;
}

// A copy of the working row, kept for this tab so the next step can paint
// with its data straight away instead of waiting on a database read (step 2's
// pre-filled dropdowns used to show up blank first). Written by the address
// modal and on every Next; OfferLayout uses it when it matches the row and
// user, and falls back to the database otherwise.
const ROW_CACHE_KEY = 'flipsplit:funnelRow';

export function cacheFunnelRow(row: Record<string, any> | null | undefined): void {
  if (!row?.id) return;
  try { sessionStorage.setItem(ROW_CACHE_KEY, JSON.stringify(row)); } catch { /* private mode */ }
}

export function readCachedFunnelRow(id: string | null, userId: string): Record<string, any> | null {
  if (!id) return null;
  try {
    const row = JSON.parse(sessionStorage.getItem(ROW_CACHE_KEY) || 'null');
    return row?.id === id && row?.user_id === userId && row?.status === 'in_progress' ? row : null;
  } catch { return null; }
}
