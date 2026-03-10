# 2025-05-14 - Pre-computed Search Blobs and Layout Cache

**Learning:** For static data registries, pre-calculating a combined lowercase search string ("search blob") at module level significantly reduces main-thread work during filtering by eliminating redundant .toLowerCase() and .join() calls on every keystroke. Additionally, high-frequency mousemove events can trigger layout thrashing if they repeatedly call getBoundingClientRect(); caching this measurement on mouseenter makes interaction logic O(1).
**Action:** Always check for static data registries and high-frequency event listeners for these specific optimization opportunities.

## 2025-05-15 - Responsive Search with useDeferredValue
**Learning:** In React 19, `useDeferredValue` is the optimal pattern for search filtering. It keeps the main thread responsive for user typing by deferring the heavy filtering computation to a non-blocking render pass. This is more efficient than debouncing as it renders the results as soon as the main thread is idle, rather than waiting for a fixed timeout.
**Action:** Use `useDeferredValue` for all search-driven list filtering to prioritize input responsiveness.
