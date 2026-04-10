# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-05 - Pre-allocating Intl.DateTimeFormat for 50x speedup

**Learning:** Repeatedly calling `toLocaleTimeString` or `toLocaleDateString` on `Date` objects incurs significant overhead from locale parsing and formatter initialization. Pre-allocating a static `Intl.DateTimeFormat` instance and using its `.format()` method is ~50x faster (~30ms vs ~1500ms for 10k ops in benchmark).
**Action:** Always pre-allocate `Intl.DateTimeFormat` for frequently called formatting tasks. When used for HH:MM:SS, explicitly set `hour: '2-digit', minute: '2-digit', second: '2-digit'` and `hour12: false` to ensure cross-platform consistency and avoid 12/24h toggle regressions.

## 2026-04-10 - Consolidating Static Formatters & Regex Initials Optimization

**Learning:** Consolidating identical static formatters (e.g., merging `INSCRIBED_DATE_FORMATTER` into `PROFILE_DATE_FORMATTER`) reduces memory overhead. For string extraction like initials, a single `matchAll` with a targeted regex `/(?:^|[._\-\s])(\w)/g` is significantly more efficient than chaining `split`, `filter`, and `map` as it avoids multiple intermediate array allocations.
**Action:** Audit codebase for redundant static formatters and replace complex string-to-array chains with targeted regex matches for performance-critical utilities.
