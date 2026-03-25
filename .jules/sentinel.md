## 2025-05-14 - Hardened Image Validation against Credential Leakage
**Vulnerability:** The `isSafeImageSrc` function used a naive prefix check for `https://` URLs, allowing them to skip full parsing. This permitted malicious URLs with embedded credentials (e.g., `https://user:pass@evil.com`) which could lead to credential leakage or SSRF-prevention bypasses.
**Learning:** Blindly trusting protocols based on string prefixes in security-critical validation functions is dangerous. Even "safe" protocols like HTTPS can carry malicious payloads in other parts of the URL.
**Prevention:** Always use a robust URL parser and perform granular checks (e.g., checking for `username` or `password` properties) on the resulting object instead of relying on simple string matching.
