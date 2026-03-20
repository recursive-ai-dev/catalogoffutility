# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2025-05-16 - Deferred Search Consistency & initials() Regex Optimization

**Learning:** React 19's `useDeferredValue` is highly effective for offloading expensive filter operations (O(N) search) from the main thread during high-frequency input, but naming mismatches in the `useMemo` dependency array (e.g. `deferredQuery` vs `deferredSearchQuery`) silently break the performance optimization or cause reference errors. Additionally, replacing `split().filter().map()` chains with a single regex match `/(?:^|[._\-\s])(\w)/g` in frequently-called utility functions like `initials()` significantly reduces intermediate array allocations and main-thread overhead.
**Action:** Always verify that deferred values are correctly tracked in dependency arrays. Use targeted regex patterns for string extraction to minimize garbage collection pressure in high-render-frequency components.
