# Palette Learnings

## 2025-05-15 - Environment-Agnostic UI Patterns

**Learning:** External libraries or browser-native methods (like `scrollIntoView`) may not be available in all execution environments (e.g., JSDOM/Vitest). Guarding these calls prevents test suite fragility without impacting production UX.
**Action:** Always use optional chaining or existence checks (e.g., `element?.scrollIntoView?.()`) for DOM methods that are not strictly guaranteed by the environment.

## 2025-05-15 - Focus Restoration on Action

**Learning:** When a user clears a search or filter, their intent is often to start a new search. Automatically restoring focus to the search input reduces friction and maintains interaction momentum.
**Action:** Call `.focus()` on the relevant input after destructive actions like clearing search queries or resetting global filters.

## 2025-05-15 - Context-Aware Keyboard Shortcuts

**Learning:** Global keyboard shortcuts (like '/' for search) can conflict with user intent when they are already interacting with an input field. Implementing a focus guard prevents accidental trigger and ensures the shortcut only acts as a navigation/focus aid.
**Action:** Always check `document.activeElement` and its `isContentEditable` property before executing global keyboard shortcuts that could interfere with text entry.
