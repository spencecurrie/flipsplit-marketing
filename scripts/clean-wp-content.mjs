/**
 * Strip WordPress CTA banners and reviewer sections from exported markdown files.
 * Run with: node scripts/clean-wp-content.mjs
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

const files = await glob('src/content/blog/*.md', { cwd: process.cwd() });
let cleaned = 0;

for (const file of files) {
  let content = await readFile(file, 'utf8');
  const original = content;

  // 1. Remove "Reviewed by" attribution line at the top of post body
  content = content.replace(/^\*\*_Reviewed by:_\*\* _.*_\n+/m, '');

  // 2. Remove reviewer bio block at the bottom (photo + bio + social icons)
  content = content.replace(/\n*!\[\]\(https:\/\/flipsplit\.com\/wp-content\/uploads\/.*?BayBrook.*?\)[\s\S]*$/m, '');

  // 3. Remove all CTA images — every variation:
  //    a. Standalone lines: [![alt](CTA-url)](link) possibly preceded by ## / ### / ####
  //    b. Inline at end of sentences:  sentence text.  [![alt](CTA-url)](link)
  //    Matches any image whose src contains "Flip-Split-CTA" or links to "/request-offer"

  // Full-line CTAs (with optional heading prefix and trailing whitespace)
  content = content.replace(
    /^[#\s]*\[?!\[.*?\]\(https?:\/\/flipsplit\.com\/wp-content\/uploads\/[^)]*Flip-Split-CTA[^)]*\)\]?\([^)]*\)?\s*$/gm,
    ''
  );

  // Inline CTAs appended to the end of a paragraph line
  content = content.replace(
    /\s*\[?!\[.*?\]\(https?:\/\/flipsplit\.com\/wp-content\/uploads\/[^)]*Flip-Split-CTA[^)]*\)\]?\([^)]*\)?/g,
    ''
  );

  // 4. Clean up runs of 3+ blank lines left behind
  content = content.replace(/\n{3,}/g, '\n\n');

  content = content.trimEnd() + '\n';

  if (content !== original) {
    await writeFile(file, content, 'utf8');
    cleaned++;
  }
}

console.log(`Cleaned ${cleaned} of ${files.length} files.`);
