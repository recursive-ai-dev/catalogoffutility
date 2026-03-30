# Palette Learnings

## 2025-05-15 - Environment-Agnostic UI Patterns

**Learning:** External libraries or browser-native methods (like `scrollIntoView`) may not be available in all execution environments (e.g., JSDOM/Vitest). Guarding these calls prevents test suite fragility without impacting production UX.
**Action:** Always use optional chaining or existence checks (e.g., `element?.scrollIntoView?.()`) for DOM methods that are not strictly guaranteed by the environment.

## 2025-05-15 - Focus Restoration on Action

**Learning:** When a user clears a search or filter, their intent is often to start a new search. Automatically restoring focus to the search input reduces friction and maintains interaction momentum.
**Action:** Call `.focus()` on the relevant input after destructive actions like clearing search queries or resetting global filters.

## 2025-05-15 - Persistent Filtering and Detail Discovery

**Learning:** In catalog-style interfaces, users expect their filter context to be preserved when navigating back from a detail view. Additionally, tags on detail pages serve as natural entry points for discovering similar content.
**Action:** Lift filtering state (e.g., `selectedTag`) to a common parent of the Catalog and Detail views to ensure persistence. Convert static metadata tags into interactive buttons that trigger the relevant filter and return the user to the filtered catalog view.
