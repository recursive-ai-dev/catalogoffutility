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

## 2025-05-25 - Password Visibility in Brutalist UIs

**Learning:** In brutalist UIs with high-contrast, mono-spaced typography, standard password dots can be visually jarring or difficult to count. Providing a visibility toggle improves accessibility for users with complex passphrases without compromising the aesthetic. Adjusting `letter-spacing` (e.g., `tracking-widest` for dots vs `tracking-wide` for text) maintains visual balance during the transition.
**Action:** Always include a password visibility toggle in authentication forms, especially when using idiosyncratic fonts or letter-spacing.
## 2025-05-15 - Adaptive Tracking for Password Toggles
**Learning:** In brutalist UIs using monospaced fonts, password fields often use heavy letter-spacing (`tracking-widest`) to make the masking characters (dots) look intentional and distinct. However, this same spacing can make plain text unreadable when the password is toggled to visible.
**Action:** Use conditional Tailwind classes to switch between `tracking-widest` (hidden) and `tracking-wide` (visible) to preserve readability while maintaining the aesthetic.

## 2026-05-02 - Layout Stability in Feedback Buttons
**Learning:** Transitioning button content (e.g., from "COPY ID" to "COPIED") can cause jarring layout shifts if the new content has a different width. Applying a fixed `min-width` that accommodates the largest possible state prevents content reflow and maintains visual stability.
**Action:** Use `min-w-[140px]` (or appropriate stable width) for feedback-providing buttons with toggling text/icons.

## 2026-05-02 - Centralized Accessibility Navigation
**Learning:** Skip-to-content links are often implemented per-page, leading to duplication or omission in dynamic single-page views. Consolidating the skip link as a shared component at the root level (`App.tsx`) ensures it is consistently available regardless of the current view state.
**Action:** Implement global accessibility features like "Skip to main content" once at the root level and target a standard ID (e.g., `#main-content`) used across all primary view containers.
