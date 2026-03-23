## 2025-05-15 - Credential Leakage in Image Hotlink Validation
**Vulnerability:** URLs with embedded credentials (e.g., `https://user:pass@host`) were not explicitly rejected during image hotlink validation.
**Learning:** Simple protocol-based short-circuits (like `startsWith("https://")`) bypass deep URL validation, allowing malicious or sensitive payloads to be processed.
**Prevention:** Always use a full URL parser and explicitly check for `username` and `password` properties even on "trusted" protocols. Reject any URL containing embedded credentials to prevent sensitive data leakage to external origins.
