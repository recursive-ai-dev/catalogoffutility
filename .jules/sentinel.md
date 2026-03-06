## 2025-05-15 - [Critical] Auth Flow ReferenceError
**Vulnerability:** ReferenceError during profile synchronization for new users.
**Learning:** Destructuring from Supabase calls was incomplete, leading to a crash when accessing `error` that wasn't captured.
**Prevention:** Always destructure both `data` and `error` from Supabase response objects to ensure robust error handling and prevent runtime crashes.

## 2025-05-20 - URL Validation & Transport Security
**Vulnerability:** Insecure image hotlinking via `postMessage` could lead to mixed-content warnings or insecure asset loading.
**Learning:** Scheme validation should be specific; `http:` is only necessary for local development. Hoisting regex and using string prefix checks before full `URL` parsing reduces overhead in high-frequency event handlers.
**Prevention:** Enforce `https:` for external assets and restrict `http:` to `localhost`/`127.0.0.1`. Use pre-compiled regex for `data:` URL validation.
