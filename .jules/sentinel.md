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

## 2025-05-16 - Vanilla JS DOM XSS & Hardening
**Vulnerability:** DOM XSS via `innerHTML` in legacy standalone HTML entries (`public/genesis.html`).
**Learning:** Standalone HTML assets bypass React's built-in XSS protections. User-controlled strings (player name, chat messages) were injected directly into `innerHTML`.
**Prevention:** Implement an `esc(str)` utility using `textContent` for manual escaping. When whitelisted formatting is required, use strict string replacement on the escaped output (e.g., `.replace(/&lt;em&gt;/g, '<em>')`) to maintain defense-in-depth. Always apply `maxLength` to vanilla HTML inputs to prevent client-side resource exhaustion.

## 2025-05-17 - Client-Side DoS via Unbounded File Imports
**Vulnerability:** Memory-based Denial of Service (DoS) in standalone HTML applications.
**Learning:** Applications that use `FileReader` to parse user-provided files (like JSON artifacts) in the browser can be crashed or hung by maliciously large payloads if size validation is omitted.
**Prevention:** Always implement explicit file size validation (e.g., `if (file.size > 1024 * 1024)`) at the entry point of file-upload handlers to protect the client-side execution environment.

## 2025-05-18 - Input Length Hardening in Legacy Assets
**Vulnerability:** Client-side Denial of Service (DoS) in standalone HTML applications.
**Learning:** Assets in the `public/` directory (like `chatgg.html`) bypass the main React application's security pipeline and input sanitization. Unbounded input fields in these vanilla JS apps can hang the browser if users paste extremely large payloads.
**Prevention:** Implement a dual-layer hardening strategy for all standalone HTML assets: use the `maxlength` attribute on interactive elements for immediate UI feedback, and enforce matching length validation in JavaScript event handlers as defense-in-depth against bypassed UI constraints.
