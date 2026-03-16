## 2025-05-15 - [Accessible Search Clearing]
**Learning:** In terminal-themed or brutalist UIs, standard browser inputs can feel disconnected. Providing an explicit, themed "Clear" button for search inputs improves the "Reset" interaction, especially when using high-contrast or minimal designs where the native "x" might be hidden or inconsistent across browsers.
**Action:** Always include a themed clear button for search inputs with an `aria-label` to ensure both aesthetic consistency and accessibility.

## 2025-05-16 - [Automated Live Feed Scrolling]
**Learning:** Automated scrolling for live feeds (like system logs or chat) reduces manual interaction and keeps the user's focus on the most recent activity, which is crucial for immersion in terminal-themed UIs. In testing environments like JSDOM, `scrollIntoView` might be missing, so always guard the call.
**Action:** Implement auto-scroll to bottom for dynamic log/terminal components using `scrollIntoView` with smooth behavior, guarded by a check for the function's existence.
## 2025-05-16 - [Atmospheric Mapping]
**Learning:** In highly themed or immersive UIs, "flavor" buttons that initially seem purely decorative can be mapped to useful utility functions (e.g., "Waste Time" -> Random App, "Forget" -> Reset Filters). This delights users by rewarding exploration with actual functionality without breaking immersion.
**Action:** Always seek to map thematic labels to logical utility actions rather than leaving them as purely cosmetic or non-functional.
