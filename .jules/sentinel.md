# Sentinel Journal

## 2025-05-15 - Protocol-based short-circuit bypass in security guards
**Vulnerability:** The `isSafeImageSrc` function used a `src.startsWith("https://")` short-circuit to avoid URL parsing overhead.
**Learning:** This short-circuit allowed URLs with embedded credentials (e.g., `https://user:pass@legit.com`) to bypass the subsequent URL parsing logic, as `new URL()` correctly identifies these components but the prefix-check does not. This can be used for URL spoofing and potentially bypassing SSRF protections.
**Prevention:** Never rely on simple string prefix checks for security-critical URL validation. Always perform full URL parsing to inspect all components (hostname, username, password, etc.) before granting access.
