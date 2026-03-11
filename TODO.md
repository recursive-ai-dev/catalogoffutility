# Catalog of Futility — TODO

## 🌑 Core System & Architecture
- [ ] **Supabase Sync**: Implement cross-device persistence for "Artifacts" (e.g., Agent Smith snapshots, Neural Runner scripts, Soul Mirror history) by syncing LocalStorage to Supabase profiles.
- [x] **Dynamic Metadata**: Update `metadata.json` or head tags dynamically based on the selected `AppEntry` for better SEO and social sharing.
- [ ] **Offline Mode**: Add a Service Worker to enable PWA capabilities, allowing the "Void" to be accessed without an active connection.
- [ ] **Telemetric Logs**: (Optional) Allow users to opt-in to sending "Void Logs" to a central database for aggregate "existential metrics."

## 🧮 Mathematical Rigor & Validation
- [ ] **Curvature Cartographer**: Replace the current "bend gain" heuristic with actual General Relativity geodesic equations for light-ray tracing in a Schwarzschild or Kerr metric.
- [ ] **Quantum Ant**: Implement a true 1D/2D Schrödinger equation solver or state vector evolution (using unitary matrices) to replace the current aesthetic-only metrics.
- [ ] **Agent Smith (Real GRU)**: Replace the keyword-based response system with a functional in-browser GRU/LSTM model (e.g., via TensorFlow.js) trained on a small curated corpus.
- [ ] **Entropy Budget**: Formalize the thermodynamic simulation using actual Boltzmann entropy formulas ($S = k_B \ln \Omega$) or Shannon entropy for information-based decay.
- [ ] **Abm-Generator**: Validate the procedural harmony generation against formal music theory matrices for "atmospheric" dissonance.

## 🏗️ Engineering Standards & CI/CD
- [ ] **TypeScript Conversion**: Migrate all standalone HTML apps in `public/` to TypeScript to ensure type safety for complex physics/math logic.
- [ ] **Unit Testing (Math Logic)**: Add Vitest/Jest suites specifically to validate the outputs of the physics engines (e.g., ensuring energy conservation in simulations).
- [ ] **Linting & Formatting**: Harmonize ESLint and Prettier configs across the React root and the legacy HTML/JS files in `public/`.
- [ ] **Automated Dependency Audits**: Integrate `npm audit` or Dependabot to manage vulnerabilities in the growing list of dependencies.

## 🎨 UI & Aesthetics
- [ ] **Mobile Refinement**: Audit the "Chamber" and "ProductPage" on small viewports. Ensure the sidebar navigation is intuitive on touch devices.
- [ ] **Custom Shaders**: Experiment with more advanced GLSL noise or CRT effects in the `Chamber` backdrop for deeper immersion.
- [ ] **Transition Polish**: Add View Transitions API support for seamless navigation between Catalog and Product pages.
- [ ] **Accessibility (A11y)**: Further improve keyboard navigation in the `Chamber` (e.g., focus trapping within the iframe when active).

## 🧩 App Catalog & Content
- [x] **Search Enhancements**: Add "Search by Tech Stack" or "Search by Version" to the catalog.
- [ ] **App Categories**: Introduce nested categories or "Collections" (e.g., "The Experimental Suite," "The Tragedy Cycle").
- [ ] **Favorites System**: Allow authenticated users to "pin" or "favorite" specific apps to their profile.

## 🛡️ Security & Stability
- [x] **Iframe Sandboxing**: Audit `sandbox` attributes for all apps. Consider a more restrictive default with specific overrides per app.
- [ ] **Error Handling**: Implement a more descriptive error recovery flow for Supabase connection failures.
- [ ] **PostMessage Validation**: Add a secondary validation layer for `postMessage` payloads to ensure they match expected JSON schemas.

## 🧪 Testing & DX
- [ ] **Visual Regression Tests**: Add Playwright or similar for visual regression testing of the "Void" aesthetic.
- [ ] **Benchmarking**: Create a performance benchmark for the Catalog grid with 100+ entries to ensure search remains sub-10ms.
- [ ] **Documentation**: Expand `.jules/` documentation with "How to Build a Void-Compatible App" guide for contributors.

---
*The void is never finished, only abandoned.*
