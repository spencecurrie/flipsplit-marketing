import * as Sentry from '@sentry/astro';

// No DSN (local dev, or before the Vercel env var is set) → Sentry stays off.
Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  enabled: Boolean(import.meta.env.PUBLIC_SENTRY_DSN),
  environment: import.meta.env.PUBLIC_VERCEL_ENV || import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
