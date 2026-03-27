# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2025-05-20 - Pre-allocating Intl.DateTimeFormat for High-Frequency Logs

**Learning:** Repeatedly calling `toLocaleTimeString` or similar formatting methods inside frequently executed components (like the Chamber's log stream) creates significant main-thread overhead due to internal `Intl` object instantiation. Pre-allocating a single `Intl.DateTimeFormat` instance and reusing it for all formatting operations measurably reduces latency and memory pressure.
**Action:** In components with high-frequency updates (clocks, logs, real-time metrics), always pre-allocate `Intl` formatters at the module level or via `useMemo` with an empty dependency array to optimize string formatting performance.
