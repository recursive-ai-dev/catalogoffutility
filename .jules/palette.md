## 2025-05-15 - [Focus Restoration]
**Learning:** Actions that reset global filters (like 'Forget' or 'Clear all filters') can leave the user in a state of 'interaction drift' where they have to manually re-focus the search input to continue their exploration.
**Action:** Programmatically restore focus to the primary search input in the `resetFilters` callback to maintain interaction momentum and improve keyboard accessibility.
