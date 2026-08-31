import type { SupabaseClient } from '@supabase/supabase-js';

// Cross-domain session handoff: marketing site → dashboard app.
//
// The two properties are separate origins (flipsplit-marketing.vercel.app and
// flipsplit-app.vercel.app) and Supabase keeps its session in localStorage,
// which is per-origin. Signing in here does not sign you in there. So we carry
// the tokens across in the URL *fragment* — never sent to a server, never in a
// Referer header — and the app calls setSession() with them and strips the
// fragment before it renders anything.
//
// The session is deliberately LEFT IN PLACE on this origin as well, so the
// nav's profile menu keeps working after the handoff. Both origins then hold
// the same refresh-token chain, and whichever refreshes first rotates the
// other's copy out — so the marketing session degrades to signed-out after an
// hour or so of app use. That is the accepted cost of running on two domains,
// and it disappears the day this site moves onto flipsplit.com and the two can
// share a cookie.

const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://flipsplit-app.vercel.app';

export async function handoffToApp(supabase: SupabaseClient, next = '/'): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  // Nothing worth carrying over — an absent or anonymous session is one the
  // dashboard would bounce anyway. Send them to the app's own sign-in.
  if (!session || session.user?.is_anonymous) {
    window.location.assign(`${APP_URL}/login`);
    return;
  }

  const fragment = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    next,
  });

  window.location.assign(`${APP_URL}/auth/handoff#${fragment.toString()}`);
}
