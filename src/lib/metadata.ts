/**
 * Document metadata.
 *
 * The old implementation set `document.title` and `meta[name=description]` from
 * inside `App.tsx` and left `og:*` / `twitter:*` pinned to whatever
 * `index.html` shipped with — so a shared link to a specific entry always
 * previewed as the generic catalog. This is the one place that owns those tags.
 */

import { SITE_DESCRIPTION, SITE_IMAGE, SITE_TITLE } from "./constants";

function writeMeta(selector: string, content: string): void {
  const elements = document.querySelectorAll(selector);
  if (elements.length) {
    elements.forEach(el => el.setAttribute("content", content));
    return;
  }
  const attribute = selector.includes("property=") ? "property" : "name";
  const key = selector.match(/"([^"]+)"/)?.[1];
  if (!key) return;
  const meta = document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.content = content;
  document.head.appendChild(meta);
}

/** Applies `title`/`description` across `<title>` and the social-preview tags. */
export function setDocumentMeta(title: string, description: string, image = SITE_IMAGE): void {
  if (typeof document === "undefined") return;
  document.title = title;
  writeMeta('meta[name="description"]', description);
  writeMeta('meta[property="og:title"]', title);
  writeMeta('meta[property="og:description"]', description);
  writeMeta('meta[name="twitter:title"]', title);
  writeMeta('meta[name="twitter:description"]', description);
  // Social crawlers require absolute public image URLs.
  let preview = SITE_IMAGE;
  try {
    const url = new URL(image, document.baseURI);
    if (url.protocol === "https:" && !url.username && !url.password) preview = url.href;
  } catch { /* Preserve the archive preview for local and malformed images. */ }
  writeMeta('meta[property="og:image"]', preview);
  writeMeta('meta[name="twitter:image"]', preview);
}

/** Resets every tag this module owns back to the archive defaults. */
export function resetDocumentMeta(defaultTitle = SITE_TITLE): void {
  setDocumentMeta(defaultTitle, SITE_DESCRIPTION);
}
