# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2025-05-16 - Pre-allocating Intl.DateTimeFormat for performance
**Learning:** Repeatedly calling `Date.prototype.toLocaleTimeString()` or creating new `Intl.DateTimeFormat` instances in a tight loop or frequently rendered component (like high-frequency system logs) is expensive due to repeated object allocation and locale resolution.
**Action:** Pre-allocate a single static `Intl.DateTimeFormat` object at the module level for frequent formatting tasks to reduce garbage collection pressure and CPU overhead.
