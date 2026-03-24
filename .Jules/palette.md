# Palette Learnings

## 2025-05-15 - Environment-Agnostic UI Patterns

**Learning:** External libraries or browser-native methods (like `scrollIntoView`) may not be available in all execution environments (e.g., JSDOM/Vitest). Guarding these calls prevents test suite fragility without impacting production UX.
**Action:** Always use optional chaining or existence checks (e.g., `element?.scrollIntoView?.()`) for DOM methods that are not strictly guaranteed by the environment.

## 2025-05-15 - Focus Restoration on Action

**Learning:** When a user clears a search or filter, their intent is often to start a new search. Automatically restoring focus to the search input reduces friction and maintains interaction momentum.
**Action:** Call `.focus()` on the relevant input after destructive actions like clearing search queries or resetting global filters.

## 2026-03-24 - Persistent Filter Navigation
**Learning:** Users often expect tags on a detail page to act as navigation shortcuts back to a filtered view of the main catalog. Lifting filter state to a common parent enables this "breadth-first" exploration pattern.
**Action:** Lift shared filtering state to the nearest common ancestor of the catalog and detail views to allow cross-page filter persistence and tag-based navigation.
