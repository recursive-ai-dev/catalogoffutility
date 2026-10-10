/**
 * Catalog data integrity.
 *
 * `data.ts` is the single source of truth for the archive, and every field in it
 * is a promise the UI makes to the visitor. These tests check the registry
 * against the filesystem and the taxonomy rules in docs/ux-foundation.md §5, so
 * a bad entry fails CI instead of rendering as a broken thumbnail or a filter
 * that silently matches nothing.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  CATALOG_ENTRIES,
  CONTRADICTORY_TAG_PAIRS,
  FILTER_TAGS,
  MAX_TAGS_PER_ENTRY,
  TAG_VOCABULARY,
  validateCatalog,
} from "../data";
import { DEFAULT_TAG } from "../lib/constants";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");

/** Resolves a `/leading-slash` public path to a real filesystem path. */
function publicPath(url: string): string {
  return path.join(PUBLIC_DIR, url.replace(/^\//, ""));
}

describe("validateCatalog", () => {
  it("reports no defects for the shipped registry", () => {
    expect(validateCatalog()).toEqual([]);
  });

  it("detects an unknown tag", () => {
    const defects = validateCatalog([
      { id: "x", title: "X", description: "d", image: "/i.svg", url: "/x.html", tags: ["Nope"] },
    ]);
    expect(defects.join(" ")).toContain('unknown tag "Nope"');
  });

  it("detects a contradictory tag pair", () => {
    const defects = validateCatalog([
      {
        id: "y",
        title: "Y",
        description: "d",
        image: "/i.svg",
        url: "/y.html",
        tags: ["Tool", "Pointless"],
      },
    ]);
    expect(defects.join(" ")).toContain("contradictory tags Tool + Pointless");
  });

  it("detects too many tags", () => {
    const defects = validateCatalog([
      {
        id: "z",
        title: "Z",
        description: "d",
        image: "/i.svg",
        url: "/z.html",
        tags: ["Tool", "Narrative", "Horror", "Endless", "Strategy"],
      },
    ]);
    expect(defects.join(" ")).toContain(`max ${MAX_TAGS_PER_ENTRY}`);
  });

  it("detects duplicate ids and entries with no source", () => {
    const defects = validateCatalog([
      { id: "dup", title: "A", description: "d", image: "/i.svg", url: "/a.html" },
      { id: "dup", title: "B", description: "d", image: "/i.svg" },
    ]);
    const joined = defects.join(" ");
    expect(joined).toContain('duplicate id "dup"');
    expect(joined).toContain("neither url nor htmlContent");
  });
});

describe("tag taxonomy", () => {
  it("filter chips are the sentinel followed by the vocabulary, in order", () => {
    expect(FILTER_TAGS).toEqual([DEFAULT_TAG, ...TAG_VOCABULARY]);
  });

  it("no shipped entry uses a tag outside the vocabulary", () => {
    for (const entry of CATALOG_ENTRIES) {
      for (const tag of entry.tags ?? []) {
        expect(TAG_VOCABULARY, `${entry.id} → ${tag}`).toContain(tag);
      }
    }
  });

  it("no shipped entry exceeds the per-entry tag ceiling", () => {
    for (const entry of CATALOG_ENTRIES) {
      expect((entry.tags ?? []).length, entry.id).toBeLessThanOrEqual(MAX_TAGS_PER_ENTRY);
    }
  });

  it("no shipped entry combines a contradictory tag pair", () => {
    for (const entry of CATALOG_ENTRIES) {
      const tags = entry.tags ?? [];
      for (const [a, b] of CONTRADICTORY_TAG_PAIRS) {
        expect(tags.includes(a) && tags.includes(b), `${entry.id}: ${a}+${b}`).toBe(false);
      }
    }
  });
});

describe("asset paths resolve to real files", () => {
  /**
   * Regression guard: `coding-ants` shipped with `image: "/images/coding-ants.svg"`
   * while the file did not exist, so its card rendered a broken thumbnail.
   */
  it("every entry image exists under public/", () => {
    const missing = CATALOG_ENTRIES.filter((e) => !existsSync(publicPath(e.image)));
    expect(missing.map((e) => e.image)).toEqual([]);
  });

  it("every entry url exists under public/", () => {
    const missing = CATALOG_ENTRIES.filter((e) => e.url && !existsSync(publicPath(e.url)));
    expect(missing.map((e) => e.url)).toEqual([]);
  });

  it("every entry declares either a url or inline htmlContent", () => {
    for (const entry of CATALOG_ENTRIES) {
      expect(entry.url || entry.htmlContent, entry.id).toBeTruthy();
    }
  });

  it("ids are unique and url-safe", () => {
    const ids = CATALOG_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });
});
