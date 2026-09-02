// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Matched on pathname rather than a substring test — a blog post slugged
// "...offer..." must not be excluded by accident.
const NOINDEX_PATHS = new Set([
  '/brand/', '/sign-in/', '/signup/', '/signup/phone/', '/offer/finish/',
  '/offer/step-1/', '/offer/step-2/', '/offer/step-3/', '/offer/step-4/',
  '/offer/step-5/', '/offer/step-6/', '/offer/step-7/',
]);

export default defineConfig({
  // Apex, not www. The live site 301s www → apex, every indexed URL is on the
  // apex, and the 211 blog posts contain 1190 absolute in-article links to the
  // apex and none to www. Building for www would point every canonical at a
  // redirect and turn every one of those links into a cross-host hop.
  site: 'https://flipsplit.com',
  trailingSlash: 'always',
  // Keep this list byte-identical to the pages carrying <meta name="robots"
  // content="noindex">. A noindexed URL left in the sitemap is reported in
  // Search Console as "Submitted URL marked noindex" — the two must agree.
  integrations: [
    sitemap({ filter: (page) => !NOINDEX_PATHS.has(new URL(page).pathname) }),
  ],
  server: {
    allowedHosts: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  }
});