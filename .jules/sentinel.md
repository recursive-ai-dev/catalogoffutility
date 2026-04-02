## 2025-05-15 - [Bypassing security checks with short-circuit logic]
**Vulnerability:** The `isSafeImageSrc` function used a prefix check (`startsWith('https://')`) as a short-circuit for safety, which could be bypassed by embedding credentials in the URL (e.g., `https://user:password@malicious.com`).
**Learning:** Security validation functions must be wary of "fast-path" optimizations that assume a protocol prefix implies safety. Malicious inputs can often hide dangerous payloads behind a trusted prefix.
**Prevention:** Always perform full URL parsing using the `URL` object for external sources, and explicitly validate or reject sensitive properties like `username` and `password` even for "safe" protocols. Ensure that any short-circuit logic is robust against variations in input format.
