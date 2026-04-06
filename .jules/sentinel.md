# Sentinel Security Journal

## 2025-05-15 - Input Length Hardening
**Vulnerability:** Client-side Denial of Service (DoS).
**Learning:** React components that process user input (like search filtering or regex matching) can be susceptible to UI thread freezing if provided with extremely large strings.
**Prevention:** Always enforce `maxLength` on `<input>` fields as a baseline defense-in-depth measure.
