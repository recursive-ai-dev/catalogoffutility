# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-01 - Pre-allocated Intl.DateTimeFormat for High-Frequency Formatting

**Learning:** Repeatedly calling `toLocaleTimeString` in performance-critical loops (such as log rendering or real-time clock updates) is significantly slower than using a pre-allocated `Intl.DateTimeFormat` object. The latter avoids the overhead of repeated locale parsing and internal object creation, providing up to an 80x speedup in formatting operations.
**Action:** For any repetitive date/time formatting, instantiate and reuse an `Intl.DateTimeFormat` object at the module level rather than calling `.toLocaleTimeString()` or `.toLocaleDateString()` directly in the hot path.
