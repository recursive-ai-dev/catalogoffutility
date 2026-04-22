# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-05 - Pre-allocating Intl.DateTimeFormat for 50x speedup

**Learning:** Repeatedly calling `toLocaleTimeString` or `toLocaleDateString` on `Date` objects incurs significant overhead from locale parsing and formatter initialization. Pre-allocating a static `Intl.DateTimeFormat` instance and using its `.format()` method is ~50x faster (~30ms vs ~1500ms for 10k ops in benchmark).
**Action:** Always pre-allocate `Intl.DateTimeFormat` for frequently called formatting tasks. When used for HH:MM:SS, explicitly set `hour: '2-digit', minute: '2-digit', second: '2-digit'` and `hour12: false` to ensure cross-platform consistency and avoid 12/24h toggle regressions.

## 2025-05-20 - Optimized Search Deferral & Profile Memoization

**Learning:** Passing raw input directly to `useDeferredValue` can trigger unnecessary re-renders for non-functional changes (e.g., adding trailing spaces or changing character case). Normalizing the query (trim/lowercase) *before* deferral ensures the heavy filtering logic only executes when the actual search intent changes. Additionally, memoizing derived profile data (`displayName`, `initialsLabel`) prevents redundant string operations during unrelated re-renders of the `UserSection`.
**Action:** Always normalize search queries before passing them to `useDeferredValue`. Memoize all derived string and date formatting in frequently re-rendered components like headers and profile sections.
