# Palette Learnings

## 2025-05-15 - Environment-Agnostic UI Patterns

**Learning:** External libraries or browser-native methods (like `scrollIntoView`) may not be available in all execution environments (e.g., JSDOM/Vitest). Guarding these calls prevents test suite fragility without impacting production UX.
**Action:** Always use optional chaining or existence checks (e.g., `element?.scrollIntoView?.()`) for DOM methods that are not strictly guaranteed by the environment.

## 2025-05-15 - Focus Restoration on Action

**Learning:** When a user clears a search or filter, their intent is often to start a new search. Automatically restoring focus to the search input reduces friction and maintains interaction momentum.
**Action:** Call `.focus()` on the relevant input after destructive actions like clearing search queries or resetting global filters.

## 2025-05-20 - Persistent Filtering & Interactive Tags

**Learning:** Lifting filtering state to a common ancestor (AppInner) allows filters to persist during navigation between views. Interactive tags on product pages provide a secondary, intuitive navigation path back to a pre-filtered catalog.
**Action:** State-lift search/filter criteria when deep links or "back" actions should preserve user context.
## 2025-05-15 - Context Persistence via State Lifting

**Learning:** Navigating between list and detail views often breaks user context if filtering state is local. Lifting search and tag state to a common ancestor (App) ensures a seamless "back" experience where the user's previous search remains intact.
**Action:** Lift UI-driven filtering state to the router or root component when persistence across navigation is required for a smooth UX.
