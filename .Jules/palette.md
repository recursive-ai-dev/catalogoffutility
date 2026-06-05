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

## 2025-05-26 - Global Accessibility Orchestration
**Learning:** Skip links are often implemented locally, leading to broken accessibility when navigating between single-page views. Globalizing the skip link at the root component level while ensuring all primary views share a common target ID (`main-content`) provides a consistent, robust accessibility experience.
**Action:** Lift the skip link to the application root and enforce a standard ID naming convention for main containers across all view components.

## 2025-05-27 - Dynamic Accessibility Labels for Toggles
**Learning:** Static ARIA labels on stateful toggles (like password visibility) can be misleading once the state changes. Providing dynamic `aria-label` and `title` attributes that reflect the *next* or *current* action (e.g., 'Show' vs 'Hide') ensures that screen reader and mouse users receive accurate, context-aware feedback.
**Action:** Use conditional logic to update `aria-label` and `title` on interactive elements whose primary function depends on a binary state.

## 2025-05-28 - Double-Click Confirmation for Destructive Actions
**Learning:** In a brutalist UI where destructive actions (like "Forget") are represented as simple text or icons, accidental triggers are common. A double-click confirmation pattern with a short timeout (e.g., 3s) provides a high-visibility safeguard ("Are you sure?") that fits the atmospheric theme without requiring a separate modal.
**Action:** Implement double-click confirmation for critical destructive actions, using distinct color shifts (e.g., red) and icon changes to signal the "confirming" state.
