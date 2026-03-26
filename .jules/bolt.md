# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2025-05-16 - Pre-allocated Intl.DateTimeFormat

**Learning:** Repeatedly calling `toLocaleTimeString` or `new Intl.DateTimeFormat().format()` inside high-frequency loops (like logging systems) is expensive due to repeated object allocation and locale resolution. Pre-allocating a single `Intl.DateTimeFormat` instance at the module level significantly reduces main-thread overhead.
**Action:** For frequently generated timestamps or formatted strings, instantiate the `Intl.DateTimeFormat` object once and reuse it across the component or utility.
