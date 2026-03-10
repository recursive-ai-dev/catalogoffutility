## 2025-05-15 - [Accessible Search Clearing]
**Learning:** In terminal-themed or brutalist UIs, standard browser inputs can feel disconnected. Providing an explicit, themed "Clear" button for search inputs improves the "Reset" interaction, especially when using high-contrast or minimal designs where the native "x" might be hidden or inconsistent across browsers.
**Action:** Always include a themed clear button for search inputs with an `aria-label` to ensure both aesthetic consistency and accessibility.

## 2025-05-16 - [Automated Live Feed Scrolling]
**Learning:** Automated scrolling for live feeds (like system logs or chat) reduces manual interaction and keeps the user's focus on the most recent activity, which is crucial for immersion in terminal-themed UIs. In testing environments like JSDOM, `scrollIntoView` might be missing, so always guard the call.
**Action:** Implement auto-scroll to bottom for dynamic log/terminal components using `scrollIntoView` with smooth behavior, guarded by a check for the function's existence.
