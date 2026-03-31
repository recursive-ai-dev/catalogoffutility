## 2025-03-03 - Credential Leakage via Protocol Short-circuit
**Vulnerability:** isSafeImageSrc protocol short-circuit bypass.
**Learning:** Short-circuiting protocol checks (e.g., `src.startsWith("https://")`) can bypass more rigorous security parsing. In this case, it allowed URLs with embedded credentials (e.g., `https://user:password@domain.com`) to be treated as safe, even though they should be rejected to prevent credential leakage or SSRF-like bypasses.
**Prevention:** Always perform full URL parsing if the protocol allows an authority component. Use the `URL` object's `username` and `password` properties to explicitly detect and reject embedded credentials, even for "safe" protocols like HTTPS.
