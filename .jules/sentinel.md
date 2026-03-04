## 2025-05-15 - [Critical] Auth Flow ReferenceError
**Vulnerability:** ReferenceError during profile synchronization for new users.
**Learning:** Destructuring from Supabase calls was incomplete, leading to a crash when accessing `error` that wasn't captured.
**Prevention:** Always destructure both `data` and `error` from Supabase response objects to ensure robust error handling and prevent runtime crashes.
