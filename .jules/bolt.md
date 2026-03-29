# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-03-29 - Pre-allocated Intl.DateTimeFormat for High-Frequency Formatting

**Learning:** `new Date().toLocaleTimeString()` is surprisingly expensive in high-frequency contexts (like global clocks or log emitters) because it creates and parses a new internationalization object on every call. Pre-allocating a single `Intl.DateTimeFormat` instance and calling `.format()` on it provides a ~30x speedup (~3ms vs ~92ms for 1000 operations).
**Action:** In high-frequency render loops or global utility functions that perform date/time formatting, always use a pre-allocated `Intl.DateTimeFormat` instance.
