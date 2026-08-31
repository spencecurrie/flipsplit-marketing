import type { SupabaseClient } from '@supabase/supabase-js';

// Send a signed-in user into the dashboard, carrying their session across.
//
// The two properties are separate origins and Supabase keeps its session in
// per-origin localStorage, so signing in here is invisible to the app. Tokens
// ride in the URL *fragment* — never sent to a server, never in a Referer —
// and the app's consumeAuthHandoff() (src/lib/authHandoff.js) adopts them and
// strips the fragment before React mounts.
//
// The fs_at/fs_rt names are that module's contract; the nav's property links
// build the same URL shape inline for their own left-click handler. Change one,
// change all three.
//
// Use this ONLY when the dashboard is genuinely where the user asked to go.
// Signing in on the marketing site is not that — it should leave them on the
// page they were reading. See sign-in.astro.
//
// The session is deliberately left in place on this origin too, so the nav's
// profile menu keeps working. Both origins then hold the same refresh-token
// chain, and the marketing one degrades to signed-out after an hour or so of
// app use. That is the cost of two domains, and it disappears at the
// flipsplit.com cutover, when both can share a cookie and this file can go.

const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://flipsplit-app.vercel.app';

export async function handoffToApp(supabase: SupabaseClient, next = '/'): Promise<void> {
  // Path-relative destinations only, so a caller can never bounce someone to
  // another site. A protocol-relative "//evil.com" is still a valid URL.
  const path = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  // Nothing worth carrying — an absent or anonymous session is one the
  // dashboard would bounce anyway. Send them to the app's own sign-in.
  if (!session?.access_token || !session?.refresh_token || session.user?.is_anonymous) {
    window.location.assign(`${APP_URL}/login`);
    return;
  }

  const fragment = new URLSearchParams({
    fs_at: session.access_token,
    fs_rt: session.refresh_token,
  });

  window.location.assign(`${APP_URL}${path}#${fragment.toString()}`);
}
