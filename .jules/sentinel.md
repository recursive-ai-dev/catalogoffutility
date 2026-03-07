## 2025-05-15 - [Critical] Auth Flow ReferenceError
**Vulnerability:** ReferenceError during profile synchronization for new users.
**Learning:** Destructuring from Supabase calls was incomplete, leading to a crash when accessing `error` that wasn't captured.
**Prevention:** Always destructure both `data` and `error` from Supabase response objects to ensure robust error handling and prevent runtime crashes.

## 2025-05-22 - [Enhancement] Strengthened Iframe postMessage Validation

**Vulnerability:** Weak `postMessage` validation only checked `origin`, allowing any window or tab on the same origin to trigger restricted UI logic (e.g., Asset Viewer) in the parent.
**Learning:** `origin` validation is insufficient for sandboxed iframes when other tabs on the same origin might be malicious. `e.source` should be verified against the intended iframe's `contentWindow`.
**Prevention:** Always verify `e.source === iframeRef.current.contentWindow` in addition to `e.origin` when handling messages from embedded iframes.
