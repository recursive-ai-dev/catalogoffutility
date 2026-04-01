## 2026-04-01 - Credential Leakage in Hotlink Interception
**Vulnerability:** Embedded credentials (e.g., https://user:pass@example.com) in image source URLs were not explicitly rejected, potentially allowing authentication or SSRF bypasses when intercepted by the hotlink script.
**Learning:** Short-circuit prefix checks (like 'https://') can bypass more rigorous URL parsing and security validation if they return too early.
**Prevention:** Always perform full URL parsing after prefix checks if security-sensitive components (like credentials) need to be validated. Use 'url.username' and 'url.password' properties of the URL object to detect embedded secrets.
