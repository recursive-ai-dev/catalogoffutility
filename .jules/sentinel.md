## 2025-05-15 - Hardening Iframe Asset Interception
**Vulnerability:** Credential leakage via embedded 'username' or 'password' in intercepted image URLs (e.g., `https://user:pass@domain.com`).
**Learning:** Performance short-circuits (like `src.startsWith("https://")`) can bypass rigorous URL parsing, creating a trust gap where malicious or malformed inputs avoid security checks.
**Prevention:** Always perform mandatory URL parsing for external inputs. If performance optimization is required, ensure the short-circuit condition is strict enough to exclude potentially unsafe payloads (e.g., by checking for '@' before skipping full parsing).
