/**
 * Site-wide constants.
 *
 * Everything here is a single source of truth for a value that previously
 * existed in two or more places (and had already started to drift). Importing
 * from here is always preferable to re-declaring a literal inline.
 */

/** Sentinel value representing the "show all" tag filter state. */
export const DEFAULT_TAG = "All_Entries" as const;

/**
 * Archive stability readout shown in both the Catalog sidebar and the Chamber
 * control panel. Previously hard-coded as `85` in one file and as the literal
 * string "85% CORRUPTION" in another, so the two could silently disagree.
 */
export const ARCHIVE_CORRUPTION = 85;

/** Hard cap on retained Chamber log entries. Oldest entries are evicted past this. */
export const MAX_LOGS = 100;

/** Document title used for the catalog (root) view. */
export const SITE_TITLE = "Catalog of Futility";
export const SITE_IMAGE = "https://github.com/user-attachments/assets/0aa67016-6eaf-4554-a0b5-a7a51a8e05ce";

/**
 * Canonical default meta description. `index.html` and `App.tsx` must agree;
 * both now read from here (index.html via the inline fallback in App.tsx, which
 * is asserted against the markup in `src/test/site.test.tsx`).
 */
export const SITE_DESCRIPTION =
  "A brutalist archive of digital artifacts, simulations, and interactive tragedies.";

/** Document title template for the product view. */
export const productTitle = (entryTitle: string): string =>
  `${entryTitle} | ${SITE_TITLE}`;

/** Document title template for the chamber view. */
export const chamberTitle = (entryTitle: string): string =>
  `[CHAMBER] ${entryTitle}`;
