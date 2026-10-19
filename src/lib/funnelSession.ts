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
