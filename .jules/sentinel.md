## 2025-05-15 - [Vulnerability in URL Parsing and Protocol Short-circuiting]
**Vulnerability:** The `isSafeImageSrc` function in `Chamber.tsx` utilized a short-circuit for `https://` prefixes, which bypassed full URL parsing and allowed URLs with embedded credentials (e.g., `https://user:pass@host`) to pass.
**Learning:** Simple prefix-based validation is insufficient for security-critical URL filtering, as it can be bypassed by complex but valid URL structures. Embedded credentials can be used for SSRF-like probes or phishing-style URL masking.
**Prevention:** Always perform full URL parsing using the `URL` constructor and explicitly validate components like `username`, `password`, and `hostname` before trusting a URL, regardless of the protocol.
