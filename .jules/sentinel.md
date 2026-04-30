## 2025-05-15 - Sandboxed Iframe Origin Constraints
**Vulnerability:** PostMessage target origin wildcard `*` used in `Chamber.tsx` for hotlink interception.
**Learning:** Sandboxed iframes without `allow-same-origin` (used for `srcDoc` apps) have a `null` origin. Browsers block `postMessage` delivery from a `null` origin to a specific target origin (even if it is the parent's actual origin). This necessitates using `*` as the target origin for communication from within the sandbox.
**Prevention:** Always implement robust receiver-side validation (origin, source, and payload schema) when wildcard target origins are required for functional compatibility. In `Chamber.tsx`, this is achieved by checking `e.origin === "null" || e.origin === window.location.origin` and verifying `e.source === iframeRef.current.contentWindow`.

## 2025-05-15 - Deployment Header Hardening
**Vulnerability:** Weak security posture in deployment configuration (CSP and missing headers).
**Learning:** Overly permissive CSP directives like `'unsafe-eval'` increase XSS risk, and missing HSTS/Permissions-Policy headers leave the application vulnerable to protocol downgrades and unauthorized browser feature access.
**Prevention:** Hardened `vercel.json` by removing `'unsafe-eval'`, enforcing HSTS for 2 years with preloading, and strictly disabling unused features (camera, microphone, geolocation) via `Permissions-Policy`.

## 2025-05-15 - Origin Leakage via Referrer
**Vulnerability:** Privacy risk of leaking application URLs to third-party asset hosts.
**Learning:** Browsers by default may send the full page URL in the `Referer` header when requesting images.
**Prevention:** Explicitly set `referrerPolicy="no-referrer"` on all `<img>` tags to ensure no referrer information is leaked to external CDN or asset providers.
