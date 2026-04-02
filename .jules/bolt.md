# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-02 - Pre-allocating Intl.DateTimeFormat for High-Frequency Formatting
**Learning:** Chaining `toLocaleTimeString` or `toLocaleDateString` in high-frequency paths (like clocks or list items) is expensive because it creates a new `Intl.DateTimeFormat` instance on every call. Benchmarks in this environment showed a ~80x speedup when using a pre-allocated formatter instance instead.
**Action:** Always pre-allocate `Intl.DateTimeFormat` at the module level for recurring date/time formatting tasks to minimize CPU overhead and GC pressure.
