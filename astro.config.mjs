// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import sentry from '@sentry/astro';
import { readdirSync, readFileSync } from 'node:fs';

// Blog post URL → last-modified date, read from each post's frontmatter
// (updatedDate, else pubDate). Feeds <lastmod> in the sitemap so Google knows
// which posts changed and re-crawls those first.
const BLOG_DIR = new URL('./src/content/blog/', import.meta.url);
const BLOG_LASTMOD = new Map(
  readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).flatMap((f) => {
    const fm = readFileSync(new URL(f, BLOG_DIR), 'utf8').split('\n---')[0];
    const date = (fm.match(/^updatedDate:\s*["']?([\d-]+)/m) || fm.match(/^pubDate:\s*["']?([\d-]+)/m) || [])[1];
    return date ? [[`/blog/${f.replace(/\.md$/, '')}/`, new Date(date).toISOString()]] : [];
  }),
);

// Matched on pathname rather than a substring test — a blog post slugged
// "...offer..." must not be excluded by accident.
const NOINDEX_PATHS = new Set([
  '/brand/', '/sign-in/', '/signup/', '/signup/phone/', '/offer/finish/',
  '/offer/step-1/', '/offer/step-2/', '/offer/step-3/', '/offer/step-4/',
  '/offer/step-5/', '/offer/step-6/', '/offer/step-7/',
  '/offer/land/', '/offer/unavailable/',
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
    sitemap({
      filter: (page) => !NOINDEX_PATHS.has(new URL(page).pathname),
      serialize(item) {
        const lastmod = BLOG_LASTMOD.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    // Static output — there is no server at runtime, so only the browser SDK
    // runs (init lives in sentry.client.config.js). Source maps upload only
    // when SENTRY_AUTH_TOKEN is set in the build env.
    sentry({
      enabled: { client: true, server: false },
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    }),
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