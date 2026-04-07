# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2025-05-15 - Intl.DateTimeFormat Pre-allocation vs. Inline Formatting

**Learning:** Calling `toLocaleTimeString` or `toLocaleDateString` repeatedly is expensive because it creates a new `Intl` formatting object on every invocation. Pre-allocating a single `Intl.DateTimeFormat` instance and reusing its `format()` method can provide a ~30x performance boost (931ms down to 30ms for 10k iterations).
**Action:** Pre-allocate `Intl.DateTimeFormat` objects for frequent formatting tasks, especially in hot paths like clock updates or list rendering.
