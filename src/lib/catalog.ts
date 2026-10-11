import type { AppEntry } from "../data";
import { DEFAULT_TAG } from "./constants";

export type SearchableEntry = AppEntry & { readonly searchBlob: string };

/** Fold presentation differences once, both for the query and the index. */
export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function buildCatalogSearchIndex(entries: readonly AppEntry[]) {
  const searchable: SearchableEntry[] = entries.map((entry) => ({
    ...entry,
    searchBlob: normalizeCatalogSearch([
      entry.id,
      entry.title,
      entry.description,
      entry.longDescription ?? "",
      entry.version ?? "",
      ...(entry.tags ?? []),
      ...(entry.tech ?? []),
    ].join(" ")),
  }));
  // A Map keeps unrecognized tags such as __proto__ out of Object.prototype.
  const byTag = new Map<string, SearchableEntry[]>();
  for (const entry of searchable) {
    for (const tag of new Set(entry.tags ?? [])) {
      const bucket = byTag.get(tag);
      if (bucket) bucket.push(entry);
      else byTag.set(tag, [entry]);
    }
  }
  return { searchable, byTag };
}

export function filterCatalogEntries(
  index: ReturnType<typeof buildCatalogSearchIndex>,
  query: string,
  tag = DEFAULT_TAG as string,
): SearchableEntry[] {
  const searchSpace = tag === DEFAULT_TAG ? index.searchable : (index.byTag.get(tag) ?? []);
  const tokens = normalizeCatalogSearch(query).split(" ").filter(Boolean);
  return tokens.length === 0
    ? searchSpace
    : searchSpace.filter((entry) => tokens.every((token) => entry.searchBlob.includes(token)));
}

export function isEditingCatalogText(element: Element | null): boolean {
  return element?.closest(
    'input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])',
  ) != null;
}

export function isCatalogDialogOpen(element: Element | null): boolean {
  return element?.closest('dialog, [role="dialog"], [aria-modal="true"]') != null ||
    document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]') != null;
}
