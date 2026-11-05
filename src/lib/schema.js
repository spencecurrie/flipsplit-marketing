// schema.org structured data (JSON-LD) shared across pages. Google reads these
// to understand who FlipSplit is, where it operates, and what each page is.
// Everything references the one Organization node by @id so Google merges them.
//
// No AggregateRating/Review markup on purpose: Google ignores (and can flag)
// "self-serving" review stars a business publishes about itself.

const SITE = 'https://flipsplit.com';
export const ORG_ID = `${SITE}/#organization`;

export const AREA_SERVED = [
  'Los Angeles County', 'Orange County', 'Riverside County',
  'San Bernardino County', 'San Diego County',
].map((name) => ({ '@type': 'AdministrativeArea', name: `${name}, CA` }));

export const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'FlipSplit',
  url: `${SITE}/`,
  logo: `${SITE}/logo-mark.png`,
  email: 'info@flipsplit.com',
  telephone: '+1-800-661-7489',
  description:
    'FlipSplit buys Southern California homes as-is for cash, renovates them at no cost to the seller, and shares the profit when the home resells.',
  areaServed: AREA_SERVED,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-800-661-7489',
    email: 'info@flipsplit.com',
    contactType: 'customer service',
    areaServed: 'US-CA',
    availableLanguage: 'English',
  },
};

export const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: 'FlipSplit',
  url: `${SITE}/`,
  publisher: { '@id': ORG_ID },
};

/** items: [{ name, path }] — path relative to the site root, e.g. '/blog/'. */
export function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.path, SITE).href,
    })),
  };
}

export function faqPage(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
