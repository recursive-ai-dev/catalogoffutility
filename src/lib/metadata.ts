/**
 * Document metadata.
 *
 * The old implementation set `document.title` and `meta[name=description]` from
 * inside `App.tsx` and left `og:*` / `twitter:*` pinned to whatever
 * `index.html` shipped with — so a shared link to a specific entry always
 * previewed as the generic catalog. This is the one place that owns those tags.
 */

import { SITE_DESCRIPTION } from "./constants";

function writeMeta(selector: string, content: string): void {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
}

/** Applies `title`/`description` across `<title>` and the social-preview tags. */
export function setDocumentMeta(title: string, description: string): void {
  document.title = title;
  writeMeta('meta[name="description"]', description);
  writeMeta('meta[property="og:title"]', title);
  writeMeta('meta[property="og:description"]', description);
  writeMeta('meta[name="twitter:title"]', title);
  writeMeta('meta[name="twitter:description"]', description);
}

/** Resets every tag this module owns back to the archive defaults. */
export function resetDocumentMeta(defaultTitle: string): void {
  setDocumentMeta(defaultTitle, SITE_DESCRIPTION);
}
