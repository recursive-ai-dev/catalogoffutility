# Catalog of Futility — TODO

Items completed during the 2026-10-10 polish run are marked done and cross-referenced to
`IMPROVEMENT.md`.

## 🌑 Core System & Architecture
- [ ] **Supabase Sync**: Implement cross-device persistence for "Artifacts" (e.g., Agent Smith snapshots, Neural Runner scripts, Soul Mirror history) by syncing LocalStorage to Supabase profiles.
- [x] **Dynamic Metadata**: Update metadata dynamically based on the selected `AppEntry`. Now routed through `src/lib/metadata.ts` so `og:*` / `twitter:*` move with the view, not just `<title>`.
- [ ] **Offline Mode**: Add a Service Worker to enable PWA capabilities. `public/site.webmanifest` now exists; the worker does not.
- [ ] **Browser navigation**: There is no router, so the browser Back button exits the app instead of returning to the catalog. Consider `history.pushState` integration behind the existing `handleBackTo*` handlers.
- [ ] **Telemetric Logs**: (Optional) Allow users to opt-in to sending "Void Logs" to a central database for aggregate "existential metrics."

## 🧮 Mathematical Rigor & Validation
- [ ] **Curvature Cartographer**: Replace the current "bend gain" heuristic with actual General Relativity geodesic equations for light-ray tracing in a Schwarzschild or Kerr metric.
- [ ] **Quantum Ant**: Implement a true 1D/2D Schrödinger equation solver or state vector evolution (using unitary matrices) to replace the current aesthetic-only metrics.
- [ ] **Agent Smith (Real GRU)**: Replace the keyword-based response system with a functional in-browser GRU/LSTM model (e.g., via TensorFlow.js) trained on a small curated corpus.
- [ ] **Entropy Budget**: Formalize the thermodynamic simulation using actual Boltzmann entropy formulas ($S = k_B \ln \Omega$) or Shannon entropy for information-based decay.
- [ ] **Abm-Generator**: Validate the procedural harmony generation against formal music theory matrices for "atmospheric" dissonance.

## 🏗️ Engineering Standards & CI/CD
- [x] **Linting**: ESLint flat config with `typescript-eslint` + `eslint-plugin-react-hooks`. This is the rule that catches hooks called after an early return — a live crash that the type-checker could not see.
- [ ] **Formatting**: Prettier is still absent; only ESLint is wired up.
- [x] **TypeScript strictness**: `strict` enabled, `@types/react` / `@types/react-dom` installed (they were missing, so nothing React-related was actually being type-checked).
- [x] **Unit Testing (Math Logic)**: `src/test/math-physics.test.ts` covers the physics engines; suite is now 170 tests across 11 files.
- [ ] **CI**: The workflow (lint → typecheck → test → build + artifact upload) is written and ships in `docs/ci.workflow.yml`, but GitHub only executes workflows from `.github/workflows/`. Move it there to activate — adding a file at that path requires the `workflows` permission, which the automated push was denied.
- [ ] **Automated Dependency Audits**: Add `npm audit --audit-level=high` to CI and enable Dependabot.

## 🎨 UI & Aesthetics
- [ ] **Mobile Refinement**: Audit the "Chamber" and "ProductPage" on small viewports. The Chamber's 320px control sidebar still has no responsive collapse.
- [ ] **Custom Shaders**: Experiment with more advanced GLSL noise or CRT effects in the `Chamber` backdrop for deeper immersion.
- [x] **Transition Polish**: View Transitions API support for navigation between Catalog / Product / Chamber.
- [x] **Accessibility (A11y)**: Nested interactive controls removed from catalog cards, focus traps fixed and shared, live regions added, `prefers-reduced-motion` implemented, global focus fallback. See `IMPROVEMENT.md` §C.
- [ ] **Icon font weight**: `Material Symbols Outlined` is loaded as a full variable font. Subsetting to the glyphs actually used would cut a large share of first-load bytes.
- [x] **Focus restoration**: Modals now return focus to their opener instead of dropping it on `<body>`.

## 🧩 App Catalog & Content
- [x] **Search Enhancements**: "Search by Tech Stack" and "Search by Version".
- [ ] **App Categories**: Introduce nested categories or "Collections" (e.g., "The Experimental Suite," "The Tragedy Cycle").
- [ ] **Favorites System**: Allow authenticated users to "pin" or "favorite" specific apps to their profile.
- [x] **Data integrity**: `validateCatalog()` enforces the tag taxonomy at load; `src/test/catalog-integrity.test.ts` also verifies every `image` and `url` resolves to a real file under `public/`.
- [ ] **Sitemap**: `public/sitemap.xml` uses a relative `<loc>/</loc>`, which the sitemaps protocol requires to be absolute. It needs the production domain.

## 🛡️ Security & Stability
- [x] **Iframe Sandboxing**: Restrictive default with per-app overrides; `referrerPolicy="no-referrer"` added.
- [x] **Error Handling**: Descriptive Supabase failure recovery, plus a top-level `ErrorBoundary` so a render throw no longer blanks the app.
- [x] **PostMessage Validation**: Origin + source + JSON-schema validation layers.
- [x] **Electron hardening**: Explicit `contextIsolation` / `sandbox` / `nodeIntegration: false`, and external links routed to the OS browser.
- [ ] **Shipped source artifacts**: `public/*.jsx`, `public/*.tsx` and `public/QuantumAntVisualization.ts` are authored source, not assets, but are served in production. Decide whether to move them out of `public/`.

## 🧪 Testing & DX
- [ ] **Visual Regression Tests**: Add Playwright or similar for visual regression testing of the "Void" aesthetic.
- [ ] **Benchmarking**: Create a performance benchmark for the Catalog grid with 100+ entries to ensure search remains sub-10ms.
- [ ] **Documentation**: Expand `.jules/` documentation with "How to Build a Void-Compatible App" guide for contributors.
- [x] **Determinism**: `Clock` provider (`src/lib/clock.ts`) and a `matchMedia` stub (`src/test/matchMedia.ts`) make time- and motion-dependent paths testable.
- [ ] **Code splitting**: Vendor chunks are now cache-stable, but `Chamber` is still eagerly bundled. Lazy-loading it would cut the entry payload further.

---
*The void is never finished, only abandoned.*
