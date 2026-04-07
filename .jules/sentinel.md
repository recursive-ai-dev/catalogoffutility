# Sentinel Security Journal

## 2025-05-15 - Input Length Hardening
**Vulnerability:** Client-side Denial of Service (DoS).
**Learning:** React components that process user input (like search filtering or regex matching) can be susceptible to UI thread freezing if provided with extremely large strings.
**Prevention:** Always enforce `maxLength` on `<input>` fields as a baseline defense-in-depth measure.
# Sentinel Security Log

## 2025-05-14 - Input Hardening & Image Validation

**Vulnerability:** Unbounded input lengths and overly permissive remote image URL validation.
**Learning:** Client-side input validation (maxLength) and strict length limits on remote URLs are essential first lines of defense against UI-level DoS and data exfiltration via URI parameters.
**Prevention:** Always enforce standard length limits (e.g., RFC 5321 for emails) and restrict remote asset URLs to reasonable sizes (e.g., 8KB) to minimize the attack surface.
