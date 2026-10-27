import * as Sentry from '@sentry/astro';

// No DSN (local dev, or before the Vercel env var is set) → Sentry stays off.
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  enabled: Boolean(import.meta.env.PUBLIC_SENTRY_DSN),
  environment: import.meta.env.PUBLIC_VERCEL_ENV || import.meta.env.MODE,
  integrations: [
    Sentry.replayIntegration({
      // Launch-phase settings: we want to actually watch how people move through the
      // site and funnel. Page text + images are visible; anything typed into a form
      // (address, phone) stays masked. Flip maskAllText/blockAllMedia back to true later.
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.1,
  // Record every session while traffic is low (launch). Lower replaysSessionSampleRate
  // (e.g. 0.1) once we're past the first few hundred sessions or hitting replay quota.
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});
