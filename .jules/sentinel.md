## 2025-05-15 - Hardening image hotlink validation
**Vulnerability:** URLs with embedded credentials (e.g., `https://user:password@example.com`) could bypass the `isSafeImageSrc` prefix short-circuit.
**Learning:** High-performance short-circuits in security-critical validation functions (like checking for `https://`) can introduce bypasses if they are too permissive and don't account for complex URL structures.
**Prevention:** Ensure prefix-based short-circuits in validation logic also check for the absence of characters that could alter the URL's interpretation (like `@` for credentials) and always perform a robust fallback check using the `URL` constructor.
