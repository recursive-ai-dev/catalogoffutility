## 2025-05-15 - Short-circuit Bypass via Credential Injection
**Vulnerability:** URLs with embedded credentials (e.g., `https://user:pass@domain.com`) could bypass security parsing logic if a simple `startsWith("https://")` short-circuit was present.
**Learning:** Short-circuit optimizations for "trusted" protocols must verify that the input does not contain unexpected components like credentials which could be used for SSRF bypass or leakage when handled by downstream systems (like an `<img>` tag or a proxy).
**Prevention:** Always parse URLs thoroughly before applying protocol-based trust, or ensure short-circuit checks explicitly exclude characters like `@` that indicate complex URL structures.
