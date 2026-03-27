## 2025-05-22 - Short-circuit bypass in URL validation
**Vulnerability:** The `isSafeImageSrc` function used a prefix-based short-circuit (`src.startsWith("https://")`) which bypassed full URL parsing.
**Learning:** Simple prefix checks are insufficient for security validation as they can mask malicious payloads like embedded credentials (`user:pass@`) or bypass subsequent hostname/path checks.
**Prevention:** Perform mandatory full URL parsing for all external schemes before applying any 'safe' status. Specifically check for `username` and `password` properties on the parsed `URL` object to prevent credential leakage and SSRF-related authentication bypasses.
