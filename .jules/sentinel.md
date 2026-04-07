# Sentinel Security Log

## 2025-05-14 - Input Hardening & Image Validation

**Vulnerability:** Unbounded input lengths and overly permissive remote image URL validation.
**Learning:** Client-side input validation (maxLength) and strict length limits on remote URLs are essential first lines of defense against UI-level DoS and data exfiltration via URI parameters.
**Prevention:** Always enforce standard length limits (e.g., RFC 5321 for emails) and restrict remote asset URLs to reasonable sizes (e.g., 8KB) to minimize the attack surface.
