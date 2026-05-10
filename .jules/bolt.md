# 2025-05-15 - Broken Search Deferral & Optimized Initials Utility

**Learning:** React 19's `useDeferredValue` is a powerful tool for maintaining input responsiveness during heavy filtering, but it requires consistent variable naming across the component to avoid `ReferenceError` and logic failures. Additionally, using a single optimized regex match (`/(?:^|[._\-\s])(\w)/g`) for extracting initials is more efficient than chaining `split`, `filter`, and `map`, as it minimizes array allocations and iterations.
**Action:** Always verify that deferred values are correctly referenced in `useMemo` dependency arrays. Use targeted regex patterns for string extraction tasks to reduce main-thread overhead in frequently rendered components like user profile sections.

## 2026-04-05 - Pre-allocating Intl.DateTimeFormat for 50x speedup

**Learning:** Repeatedly calling `toLocaleTimeString` or `toLocaleDateString` on `Date` objects incurs significant overhead from locale parsing and formatter initialization. Pre-allocating a static `Intl.DateTimeFormat` instance and using its `.format()` method is ~50x faster (~30ms vs ~1500ms for 10k ops in benchmark).
**Action:** Always pre-allocate `Intl.DateTimeFormat` for frequently called formatting tasks. When used for HH:MM:SS, explicitly set `hour: '2-digit', minute: '2-digit', second: '2-digit'` and `hour12: false` to ensure cross-platform consistency and avoid 12/24h toggle regressions.

## 2026-04-10 - Stable Navigation Callbacks for Memoized Trees

**Learning:** In a deeply nested component tree where large leaf components (like `ProductPage` or `Chamber`) are wrapped in `React.memo`, passing navigation callbacks that depend on transient state (like the current `view` or `selectedApp`) can trigger unnecessary cascading re-renders. Using `useRef` to track these transient dependencies within the callbacks allows them to remain referentially stable (empty dependency array) while still being functionally correct.

**Action:** When passing callbacks to memoized components, evaluate if dependencies can be moved to `useRef` to maintain referential stability, especially for state that changes frequently or triggers global re-renders.

## 2026-04-15 - Component Decomposition for Deferral-Aware Memoization

**Learning:** React 19's `useDeferredValue` is most effective when paired with memoized sub-components. If a component containing both an "urgent" state (like a search input value) and a "deferred" value (like filtered results) is a single monolithic tree, the entire tree will still reconcile during the urgent pass, even if expensive parts are wrapped in `useMemo`. Decomposing the tree into memoized sub-components (`Sidebar`, `EntryGrid`, etc.) allows branches that don't depend on the urgent state to be skipped entirely during the urgent pass, keeping the UI highly responsive.

**Action:** When using `useDeferredValue` for heavy filtering, decompose the parent component into memoized sub-components and pass the deferred value only to the branches that actually require it.
