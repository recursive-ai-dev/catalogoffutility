## 2025-05-15 - Sandboxed Iframe Origin Constraints
**Vulnerability:** PostMessage target origin wildcard `*` used in `Chamber.tsx` for hotlink interception.
**Learning:** Sandboxed iframes without `allow-same-origin` (used for `srcDoc` apps) have a `null` origin. Browsers block `postMessage` delivery from a `null` origin to a specific target origin (even if it is the parent's actual origin). This necessitates using `*` as the target origin for communication from within the sandbox.
**Prevention:** Always implement robust receiver-side validation (origin, source, and payload schema) when wildcard target origins are required for functional compatibility. In `Chamber.tsx`, this is achieved by checking `e.origin === "null" || e.origin === window.location.origin` and verifying `e.source === iframeRef.current.contentWindow`.
# Sentinel Security Journal

## 2025-05-15 - Input Length Hardening
**Vulnerability:** Client-side Denial of Service (DoS).
**Learning:** React components that process user input (like search filtering or regex matching) can be susceptible to UI thread freezing if provided with extremely large strings.
**Prevention:** Always enforce `maxLength` on `<input>` fields as a baseline defense-in-depth measure.
# Sentinel Security Log

## 2025-05-14 - Input Hardening & Image Validation

**Vulnerability:** Unbounded input lengths and overly permissive remote image URL validation.
**Learning:** Client-side input validation (maxLength) and strict length limits on remote URLs are essential first lines of defense against UI-level DoS and data exfiltration via URI parameters.
**Prevention:** Always enforce standard length limits (e.g., RFC 5321 for emails) and restrict remote asset URLs to reasonable sizes (e.g., 8KB) to minimize the attack surface.

## 2026-04-27 - Security Logic Restoration & Defense in Depth
**Vulnerability:** Reference errors in authentication gating logic.
**Learning:** Broken variable references in core navigation and auth-gate handlers (e.g., `isLoggedIn`) can silently disable intended security constraints, allowing unauthorized access or breaking UI-level protections.
**Prevention:** Always verify that state-derived security flags are correctly scoped and defined within the components that consume them. Supplement logic fixes with passive defense-in-depth measures like hardening CSP and Referrer-Policy.
