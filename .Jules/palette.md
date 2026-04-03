# Palette Learnings

## 2025-05-15 - Environment-Agnostic UI Patterns

**Learning:** External libraries or browser-native methods (like `scrollIntoView`) may not be available in all execution environments (e.g., JSDOM/Vitest). Guarding these calls prevents test suite fragility without impacting production UX.
**Action:** Always use optional chaining or existence checks (e.g., `element?.scrollIntoView?.()`) for DOM methods that are not strictly guaranteed by the environment.

## 2025-05-15 - Focus Restoration on Action

**Learning:** When a user clears a search or filter, their intent is often to start a new search. Automatically restoring focus to the search input reduces friction and maintains interaction momentum.
**Action:** Call `.focus()` on the relevant input after destructive actions like clearing search queries or resetting global filters.

## 2025-05-20 - Contextual Persistent Navigation

**Learning:** Lifting filtering state to a shared parent allows for more natural navigation patterns. Users expect that clicking a tag on a detail page will not only return them to the list but also apply that filter immediately.
**Action:** Lift shared UI state (like active filters) when implementing deep links or interactive elements that span multiple views to maintain user context.
