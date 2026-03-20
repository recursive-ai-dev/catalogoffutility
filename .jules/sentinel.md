## 2025-05-21 - Protocol-based short-circuits and credential leakage
**Vulnerability:** Simple prefix-based protocol validation (e.g., `src.startsWith("https://")`) bypasses formal URL parsing and fails to detect embedded credentials (e.g., `https://user:pass@host`).
**Learning:** Short-circuits for performance in security-sensitive functions can create loopholes if they don't account for the full URI specification. Embedded credentials in URLs can be leaked into logs or UI components if not explicitly rejected.
**Prevention:** Always use a robust URL parser (like the `URL` constructor) for external input validation. Explicitly check `url.username` and `url.password` even for trusted protocols like `https:`.
