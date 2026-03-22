## 2026-03-22 - [Security Enhancement] URL Validation for Embedded Credentials
**Vulnerability:** URLs with embedded credentials (e.g., `https://user:pass@example.com`) could bypass protocol-based short-circuits and potentially lead to SSRF or credential-leakage exploits.
**Learning:** Simple string-prefix short-circuits (like `src.startsWith("https://")`) in security validation functions can hide malicious payloads. Standard URL parsing should always be performed to inspect components like `username` and `password`.
**Prevention:** Avoid protocol short-circuits for external URLs. Parse every URL using the standard `URL` constructor and explicitly verify that `url.username` and `url.password` are empty.
