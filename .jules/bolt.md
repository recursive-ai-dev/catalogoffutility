# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-05 - Pre-allocating Intl.DateTimeFormat for 50x speedup

**Learning:** Repeatedly calling `toLocaleTimeString` or `toLocaleDateString` on `Date` objects incurs significant overhead from locale parsing and formatter initialization. Pre-allocating a static `Intl.DateTimeFormat` instance and using its `.format()` method is ~50x faster (~30ms vs ~1500ms for 10k ops in benchmark).
**Action:** Always pre-allocate `Intl.DateTimeFormat` for frequently called formatting tasks. When used for HH:MM:SS, explicitly set `hour: '2-digit', minute: '2-digit', second: '2-digit'` and `hour12: false` to ensure cross-platform consistency and avoid 12/24h toggle regressions.

## 2026-04-10 - Stable Navigation Callbacks for Memoized Trees

**Learning:** In a deeply nested component tree where large leaf components (like `ProductPage` or `Chamber`) are wrapped in `React.memo`, passing navigation callbacks that depend on transient state (like the current `view` or `selectedApp`) can trigger unnecessary cascading re-renders. Using `useRef` to track these transient dependencies within the callbacks allows them to remain referentially stable (empty dependency array) while still being functionally correct.

**Action:** When passing callbacks to memoized components, evaluate if dependencies can be moved to `useRef` to maintain referential stability, especially for state that changes frequently or triggers global re-renders.

## 2026-05-20 - O(1) Random Navigation via Pre-computed Registries

**Learning:** In applications with static registries like `CATALOG_ENTRIES`, performing O(N) filtering operations (e.g., filtering by auth requirements or missing status) within interaction handlers like "Waste Time" introduces unnecessary main-thread work. Pre-computing these subsets (`NAVIGABLE_ANON`, `NAVIGABLE_AUTH`) at the module level allows for O(1) random selection, significantly reducing keystroke and click latency.

**Action:** Always identify static data subsets that are frequently used for navigation or filtering and hoist their computation to the module scope to avoid repeated iteration during user interactions.
