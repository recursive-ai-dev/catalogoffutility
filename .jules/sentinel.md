# Sentinel Security Journal

## 2025-05-15 - Hardening isSafeImageSrc against Credential Leakage
**Vulnerability:** External image URLs in `isSafeImageSrc` with the `https:` protocol were blindly trusted based on a prefix short-circuit, allowing URLs with embedded credentials (e.g., `https://user:pass@domain.com`) to bypass security checks.
**Learning:** Protocol-based short-circuits (like `src.startsWith("https://")`) are insufficient for security validation because they don't account for malicious payloads like embedded credentials that can be used for authentication bypass or SSRF-prevention bypass.
**Prevention:** Always perform full URL parsing (e.g., using the `URL` constructor) for remote sources and explicitly validate security-sensitive properties like `username` and `password` even for trusted protocols.
