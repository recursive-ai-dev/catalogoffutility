## 2026-05-26 - [Discovery: Centralized UX Feedback]
**Learning:** In a complex application with both UI clicks and global keyboard shortcuts, user feedback (like notifications) can become inconsistent if logic is duplicated. Centralizing feedback within shared state-update callbacks (e.g., `resetFilters`) ensures that both interactions provide the same visual confirmation.
**Action:** Always wrap state updates that require user feedback into stable, reusable callbacks and use those callbacks in both event handlers and keyboard listeners.

## 2026-05-26 - [A11y: Discoverable Shortcuts]
**Learning:** Keyboard shortcuts are powerful but often invisible. Providing visual hints (e.g., `[R]`, `[Esc]`) using a consistent style (`font-mono`, low opacity) and including the shortcut information in `aria-label` attributes (e.g., "Waste Time (Shortcut: R)") significantly improves discoverability for all users, including those using screen readers.
**Action:** When adding keyboard shortcuts, include a visual hint in the UI and a descriptive `aria-label` on the trigger element. Ensure the visual hint is `aria-hidden="true"` to avoid redundancy for screen readers.
