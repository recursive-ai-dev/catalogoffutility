## 2025-05-15 - [Critical] Auth Flow ReferenceError
**Vulnerability:** ReferenceError during profile synchronization for new users.
**Learning:** Destructuring from Supabase calls was incomplete, leading to a crash when accessing `error` that wasn't captured.
**Prevention:** Always destructure both `data` and `error` from Supabase response objects to ensure robust error handling and prevent runtime crashes.

## 2025-05-20 - URL Validation & Transport Security
**Vulnerability:** Insecure image hotlinking via `postMessage` could lead to mixed-content warnings or insecure asset loading.
**Learning:** Scheme validation should be specific; `http:` is only necessary for local development. Hoisting regex and using string prefix checks before full `URL` parsing reduces overhead in high-frequency event handlers.
**Prevention:** Enforce `https:` for external assets and restrict `http:` to `localhost`/`127.0.0.1`. Use pre-compiled regex for `data:` URL validation.
## 2025-05-22 - [Enhancement] Strengthened Iframe postMessage Validation

**Vulnerability:** Weak `postMessage` validation only checked `origin`, allowing any window or tab on the same origin to trigger restricted UI logic (e.g., Asset Viewer) in the parent.
**Learning:** `origin` validation is insufficient for sandboxed iframes when other tabs on the same origin might be malicious. `e.source` should be verified against the intended iframe's `contentWindow`.
**Prevention:** Always verify `e.source === iframeRef.current.contentWindow` in addition to `e.origin` when handling messages from embedded iframes.

## 2025-05-30 - [High] Insecure HTTP Short-circuit in Image Validation
**Vulnerability:** `isSafeImageSrc` contained a short-circuit for `http://` URLs, allowing any external insecure HTTP image to bypass hostname validation (which was intended to restrict HTTP to localhost/127.0.0.1).
**Learning:** Over-eager protocol short-circuits can accidentally bypass more specific security constraints (like hostname checks) defined later in the function.
**Prevention:** Only short-circuit protocols that are inherently safe (like `https:`). Never short-circuit protocols that require further contextual validation.
