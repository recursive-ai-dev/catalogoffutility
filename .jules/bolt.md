# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-03 - Intl.DateTimeFormat Pre-allocation vs. toLocaleTimeString/toLocaleDateString

**Learning:** `Intl.DateTimeFormat` objects are expensive to initialize but extremely fast to execute. Reusing a pre-allocated formatter instance for frequent date/time operations (e.g., in clock components or large lists) can provide a ~60-80x performance boost over calling `.toLocaleTimeString()` or `.toLocaleDateString()` repeatedly, as the latter creates a new formatter instance internally on every call.
**Action:** Pre-allocate `Intl.DateTimeFormat` objects at the module level or in a persistent ref for any formatting operation that occurs frequently or in a tight loop.
