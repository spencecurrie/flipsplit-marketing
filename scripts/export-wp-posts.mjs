/**
 * Export all WordPress blog posts to Astro content collection Markdown files.
 * Run once with: node scripts/export-wp-posts.mjs
 *
 * Requires: npm install --save-dev turndown
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WP_API = 'https://www.flipsplit.com/wp-json/wp/v2';
const OUT_DIR = path.join(__dirname, '../src/content/blog');

// ── Turndown config ──────────────────────────────────────────────────────────

const td = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

// Strip WP block wrapper divs — keep inner content
td.addRule('divPassthrough', {
  filter: ['div', 'figure', 'figcaption'],
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});

// Strip WP shortcodes like [caption ...] text [/caption]
function stripShortcodes(html) {
  return html
    .replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gis, '$1')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/<!--.*?-->/gs, '');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function getDescription(post) {
  if (post.yoast_head_json?.description) return post.yoast_head_json.description;
  const raw = post.excerpt?.rendered || '';
  return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function getCategory(post) {
  const terms = post._embedded?.['wp:term']?.[0] ?? [];
  const cat = terms.find(t => t.slug !== 'uncategorized' && t.slug !== 'all-articles');
  return cat?.name ?? 'Home Selling';
}

function getFeaturedImage(post) {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
}

function readingTime(markdown) {
  const words = markdown.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 220));
}

function yamlStr(value) {
  if (!value) return '""';
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
  return `"${escaped}"`;
}

// ── Fetch ────────────────────────────────────────────────────────────────────

async function fetchAllPosts() {
  const all = [];
  let page = 1;

  while (true) {
    const url = `${WP_API}/posts?per_page=100&page=${page}&status=publish&_embed`;
    const res = await fetch(url);

    if (res.status === 400) break; // past last page
    if (!res.ok) {
      console.error(`HTTP ${res.status} fetching page ${page}`);
      break;
    }

    const batch = await res.json();
    if (!batch.length) break;

    all.push(...batch);

    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') ?? '1', 10);
    console.log(`  Page ${page}/${totalPages} — ${all.length} posts fetched so far`);
    if (page >= totalPages) break;
    page++;
  }

  return all;
}

// ── Export ───────────────────────────────────────────────────────────────────

async function exportPost(post) {
  const slug = post.slug;
  const title = decodeHtmlEntities(post.title.rendered);
  const description = getDescription(post);
  const pubDate = post.date.split('T')[0];
  const updatedDate = post.modified?.split('T')[0];
  const category = getCategory(post);
  const heroImage = getFeaturedImage(post);

  const rawHtml = stripShortcodes(post.content.rendered);
  let body = td.turndown(rawHtml);
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  const minutes = readingTime(body);

  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `description: ${yamlStr(description)}`,
    `pubDate: ${pubDate}`,
    updatedDate && updatedDate !== pubDate ? `updatedDate: ${updatedDate}` : null,
    `category: ${yamlStr(category)}`,
    `reviewer: "Brandon Brown"`,
    `readingTime: ${minutes}`,
    heroImage ? `heroImage: ${yamlStr(heroImage)}` : null,
    '---',
  ].filter(Boolean).join('\n');

  await writeFile(path.join(OUT_DIR, `${slug}.md`), `${fm}\n\n${body}\n`, 'utf8');
  return slug;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  console.log('Fetching posts from WordPress REST API…');
  const posts = await fetchAllPosts();
  console.log(`\nExporting ${posts.length} posts…\n`);

  let done = 0;
  const errors = [];

  for (const post of posts) {
    try {
      await exportPost(post);
      done++;
      if (done % 50 === 0 || done === posts.length) {
        process.stdout.write(`  ${done}/${posts.length}\n`);
      }
    } catch (err) {
      errors.push(`${post.slug}: ${err.message}`);
    }
  }

  console.log(`\nDone — ${done} posts written to src/content/blog/`);
  if (errors.length) {
    console.log(`\nFailed (${errors.length}):`);
    errors.forEach(e => console.log(`  ✗ ${e}`));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
