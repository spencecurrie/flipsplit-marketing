// Which properties we can make an offer on, and where the funnel goes next.
//
// We never offer on multi-family homes or empty lots, and only offer on a
// manufactured or mobile home when the owner also owns the land.
//
// ⚠ SECOND COPY: flipsplit-app/src/lib/propertyEligibility.js is the in-app
// funnel's version. funnelValues.test.js in that repo runs both over the same
// answers and fails if they disagree.

export const LAND_HREF = '/offer/land/';
export const UNAVAILABLE_HREF = '/offer/unavailable/';

const NEVER_OFFER = ['multi_family', 'empty_lot'];

type Row = { home_category?: string | null; owns_land?: boolean | null };

export interface FunnelRoute {
  href: string;
  /** Written to current_step. A declined or half-answered row stays at 2, so
   *  re-entering the address resumes at step 3 rather than past the question. */
  currentStep: number;
  /** Overrides the default step_N_completed event name. */
  event?: string;
  /** Also record a property_declined event, so turned-away visitors can be counted. */
  declined?: boolean;
}

/** Where a finished answer sends this row: on with the funnel, to the land
 *  question, or to the "can't offer" page. */
export function propertyGate(row: Row | null | undefined): 'ok' | 'ask_land' | 'unavailable' {
  const category = row?.home_category;
  if (category && NEVER_OFFER.includes(category)) return 'unavailable';
  if (category === 'manufactured_mobile') {
    if (row?.owns_land === true) return 'ok';
    return row?.owns_land === false ? 'unavailable' : 'ask_land';
  }
  return 'ok';
}

/** Step 3's answer. Null means carry on to step 4 as normal. */
export function routeForCategory(category: string): FunnelRoute | null {
  if (NEVER_OFFER.includes(category)) return { href: UNAVAILABLE_HREF, currentStep: 2, declined: true };
  if (category === 'manufactured_mobile') return { href: LAND_HREF, currentStep: 2 };
  return null;
}

/** The land question's answer. */
export function routeForLand(ownsLand: boolean): FunnelRoute {
  return ownsLand
    ? { href: '/offer/step-4/', currentStep: 3, event: 'land_ownership_answered' }
    : { href: UNAVAILABLE_HREF, currentStep: 2, event: 'land_ownership_answered', declined: true };
}
