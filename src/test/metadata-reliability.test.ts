import { afterEach, describe, expect, it, vi } from "vitest";
import { resetDocumentMeta, setDocumentMeta } from "../lib/metadata";
import { SITE_IMAGE, SITE_TITLE } from "../lib/constants";

afterEach(() => { vi.unstubAllGlobals(); });

describe("metadata recovery and entry previews", () => {
  it("creates missing tags and updates duplicated tags consistently", () => {
    document.head.innerHTML = '<meta name="description"><meta name="description">';
    setDocumentMeta("Entry", "Description", "https://images.example.test/entry.jpg");
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(2);
    document.querySelectorAll('meta[name="description"]').forEach(meta => expect(meta.getAttribute("content")).toBe("Description"));
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe("https://images.example.test/entry.jpg");
  });

  it.each(["javascript:alert(1)", "/local.jpg", "https://user:pass@example.test/image.jpg"])("falls back for a nonpublic image %s", (image) => {
    setDocumentMeta("Entry", "Description", image);
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute("content")).toBe(SITE_IMAGE);
  });

  it("restores the archive image and title after leaving an entry", () => {
    setDocumentMeta("Entry", "Description", "https://example.test/entry.jpg");
    resetDocumentMeta();
    expect(document.title).toBe(SITE_TITLE);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(SITE_IMAGE);
  });

  it("resolves a registry thumbnail into a public HTTPS social image", () => {
    document.head.innerHTML = '<base href="https://archive.example.test/">';
    setDocumentMeta("Entry", "Description", "/images/entry.svg");
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe("https://archive.example.test/images/entry.svg");
  });

  it("can be called outside a browser", () => {
    vi.stubGlobal("document", undefined);
    expect(() => resetDocumentMeta()).not.toThrow();
  });
});
