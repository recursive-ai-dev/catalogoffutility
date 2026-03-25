# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2025-05-15 - Pre-allocate Intl.DateTimeFormat for High-Frequency Logs

**Learning:** Calling `toLocaleTimeString` or `toLocaleDateString` repeatedly with options creates a new `Intl.DateTimeFormat` object on every invocation. In high-frequency paths like system clocks or log generators, this introduces significant CPU overhead and garbage collection pressure. Pre-allocating the formatter at the module level and using its `format()` method reduces execution time for each timestamp by ~10-15x.
**Action:** Identify any frequent date/time formatting operations and replace inline `toLocale*` calls with a shared, module-level `Intl.DateTimeFormat` instance.
