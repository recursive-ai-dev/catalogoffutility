## 2025-05-20 - Double-Memoization for Search & Profile Data

**Learning:** Separating functional normalization (trim/lowercase) from O(N) filtering via "double-memoization" allows React to skip expensive list operations when non-functional characters (like whitespace) change. Additionally, memoizing derived profile data (initials, formatted dates) in components like `UserSection` prevents redundant computations during re-renders triggered by unrelated context updates.
**Action:** Use a dedicated `useMemo` for input normalization before passing it to expensive filtering logic. Move regex definitions for string extraction to the module level to avoid repeated compilation.
