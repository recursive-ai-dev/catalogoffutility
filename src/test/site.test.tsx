/**
 * Site metadata.
 *
 * `index.html` and `src/lib/constants.ts` used to carry two different default
 * descriptions, and `App.tsx` only ever updated `<title>` and
 * `meta[name=description]` — so sharing a link to a specific entry always
 * previewed as the generic archive.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SITE_DESCRIPTION, SITE_TITLE, chamberTitle, productTitle } from "../lib/constants";
import { resetDocumentMeta, setDocumentMeta } from "../lib/metadata";

const INDEX_HTML = readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");

function metaFrom(html: string, selector: string): string | null {
  // Only Open Graph uses `property=`; Twitter Card tags are `name=`. Getting
  // this backwards silently matched nothing.
  const attr = selector.startsWith("og:") ? "property" : "name";
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
  );
  const tag = html.match(re)?.[0] ?? null;
  return tag?.match(/content=["']([^"']*)["']/)?.[1] ?? null;
}

describe("index.html static metadata", () => {
  it("uses the same default description as the runtime constant", () => {
    expect(metaFrom(INDEX_HTML, "description")).toBe(SITE_DESCRIPTION);
    expect(metaFrom(INDEX_HTML, "og:description")).toBe(SITE_DESCRIPTION);
    expect(metaFrom(INDEX_HTML, "twitter:description")).toBe(SITE_DESCRIPTION);
  });

  it("declares the site title consistently across the social tags", () => {
    expect(metaFrom(INDEX_HTML, "og:title")).toBe(SITE_TITLE);
    expect(metaFrom(INDEX_HTML, "twitter:title")).toBe(SITE_TITLE);
    expect(INDEX_HTML).toContain(`<title>${SITE_TITLE}</title>`);
  });

  it("ships a large-image card with an image, a theme colour and a manifest", () => {
    expect(metaFrom(INDEX_HTML, "twitter:card")).toBe("summary_large_image");
    expect(metaFrom(INDEX_HTML, "og:image")).toMatch(/^https:\/\//);
    expect(metaFrom(INDEX_HTML, "theme-color")).toBe("#000000");
    expect(metaFrom(INDEX_HTML, "color-scheme")).toBe("dark");
    expect(INDEX_HTML).toContain('rel="manifest"');
  });
});

describe("setDocumentMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <meta name="description" content="">
      <meta property="og:title" content="">
      <meta property="og:description" content="">
      <meta name="twitter:title" content="">
      <meta name="twitter:description" content="">
    `;
  });

  it("moves every social tag with the view, not just <title>", () => {
    setDocumentMeta(productTitle("KIRA"), "She texts back.");

    expect(document.title).toBe("KIRA | Catalog of Futility");
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "She texts back.",
    );
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "KIRA | Catalog of Futility",
    );
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "She texts back.",
    );
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "KIRA | Catalog of Futility",
    );
  });

  it("formats chamber titles distinctly from product titles", () => {
    expect(productTitle("KIRA")).toBe("KIRA | Catalog of Futility");
    expect(chamberTitle("KIRA")).toBe("[CHAMBER] KIRA");
  });

  it("restores the archive defaults", () => {
    setDocumentMeta(productTitle("KIRA"), "She texts back.");
    resetDocumentMeta(SITE_TITLE);

    expect(document.title).toBe(SITE_TITLE);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      SITE_DESCRIPTION,
    );
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute(
      "content",
      SITE_DESCRIPTION,
    );
  });

  it("does not throw when a tag is absent from the document", () => {
    document.head.innerHTML = "";
    expect(() => setDocumentMeta("T", "D")).not.toThrow();
    expect(document.title).toBe("T");
  });
});
