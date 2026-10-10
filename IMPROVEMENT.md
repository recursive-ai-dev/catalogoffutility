# 52-Point Improvement & Polish Run

**Date:** 2026-10-10
**Scope:** `src/`, `public/`, build tooling, CI, docs
**Requested:** 52 improvements · **Delivered:** 52 numbered items below (several bundle more than one edit)

**Verification** — every claim in this document was produced by running the project's own
commands in this checkout:

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` (eslint) | 0 errors, 0 warnings |
| Types | `npm run typecheck` (tsc, `strict`) | clean |
| Tests | `npm run test` | **170 passed** across 11 files (was 105 across 4) |
| Build | `npm run build` | success |
| All four | `npm run check` | success |

Bundle, before → after:

```
before   dist/assets/index-Fp3prfGI.js   463.65 kB │ gzip: 133.85 kB   (1 chunk)
after    dist/assets/index-CHG3wxgR.js    99.51 kB │ gzip:  28.63 kB   app
         dist/assets/react-CmGSpuP4.js   193.83 kB │ gzip:  60.55 kB   vendor (cache-stable)
         dist/assets/supabase-*.js       174.16 kB │ gzip:  45.90 kB   vendor (cache-stable)
```

---

## A. Correctness — defects that were live

### 1. Sign-in crashed the entire catalog
`UserSection` (`src/Catalog.tsx`) called three `useMemo` hooks **after** its `loading` and
`!user` early returns. Signed out it executed 3 hooks; the moment a session arrived it
executed 6, and React aborted the render:

```
Error: Rendered more hooks than during the previous render.
```

Every successful sign-in blanked the app. Hooks are now hoisted above the guards.

*Proof:* `src/test/auth-transition.test.tsx` passes against the fix and **fails against
`HEAD`'s `Catalog.tsx` with the exact error above**. `tsc` cannot see this; see item 15.

### 2. Catalog entry violated its own tag taxonomy
`narrative-beat-graph` carried `["Tool", "Pointless"]`. `docs/ux-foundation.md` §5 states
these two "cannot appear together (contradiction)" — a practical utility cannot also be
deliberately without purpose. Re-tagged `["Tool", "Strategy"]` (it produces a real artifact:
a beat graph).

### 3. Broken thumbnail on the CODING ANTS card
`data.ts` references `/images/coding-ants.svg`; the file did not exist, so that card rendered
a broken image. Authored `public/images/coding-ants.svg` at the 800×600 canvas every other
entry uses.

### 4. Electron dev shell pointed at a dead origin
`main.js` loaded `http://localhost:5173` (Vite's default) while `npm run dev` binds port
**3000**. Now reads `VITE_DEV_SERVER_URL` with a 3000 default.

### 5. `preload.js` was entirely dead code
It looked for `#chrome-version`, `#node-version` and `#electron-version` elements that have
never existed in `index.html`. Replaced with a `contextBridge`-exposed `window.voidRuntime`
API — the contextIsolation-safe channel.

### 6. Stray Supabase scaffold removed
`page.tsx` (repo root) rendered a `todos` table that is not in `supabase/schema.sql`, typed
`any[]`, unreachable from `index.html`. Deleted.

### 7. Unreachable branch in `isSafeImageSrc`
The `url.protocol === "data:"` case inside the `try` could never run — every `data:` src
returns from the first block. Removed rather than left implying coverage that did not exist.

### 8. `.env.example` did not exist
`README.md` instructs `cp .env.example .env.local`. The file was absent, and the README
documented `APP_URL`, which no code reads. Added `.env.example` with the real variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and corrected the README.

### 9. State typed as a literal
`useState(DEFAULT_TAG)` inferred `"All_Entries"` — once `@types/react` existed (item 14),
every real tag assignment was a type error. Now `useState<string>(DEFAULT_TAG)`.

---

## B. Type safety & linting

### 10. `npm run lint` was not checking anything
`@types/react` and `@types/react-dom` were **not installed**. With `strict` also off, every
`import React from "react"` silently resolved to `any` — so `React.memo`, `React.Component`,
all JSX prop types and every event handler were unchecked. The README's "Type-Safe" claim was
not enforced. Both packages added.

### 11. `strict` was never enabled
`tsconfig.json` had no `strict`. Enabled, plus `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, `noImplicitOverride`,
`noImplicitReturns`. All resulting errors fixed, not suppressed.

### 12. `tsconfig` scope tightened
`include` is now `["src", "vite.config.ts"]`; the Electron entrypoints (`main.js`,
`preload.js`) are excluded from the DOM-oriented graph.

### 13. No linter existed
Added `eslint.config.js` (flat config) with `typescript-eslint`, `eslint-plugin-react-hooks`
and `eslint-plugin-react-refresh`. `npm run lint` → eslint, `npm run typecheck` → tsc (the old
`lint` script was a mislabelled `tsc --noEmit`).

### 14. Verified the linter actually catches the item-1 defect
Reintroducing the original hooks order yields:

```
169:24  error  React Hook "useMemo" is called conditionally. React Hooks must be called in
               the exact same order in every component render. Did you accidentally call a
               React Hook after an early return?  react-hooks/rules-of-hooks
```

Clean after the fix.

### 15. Fixed the linter's findings rather than muting them
- `PrivacyBanner` — consent read moved from an effect into a lazy state initializer.
- `auth.tsx` — `loading` / `connectionError` seeded from initial state instead of assigned in an effect.
- `App.tsx` — auth-transition correction rewritten as a render-time state adjustment.
- `data.ts` — 2 redundant `\"` escapes removed (rendered text verified byte-identical for all 22 `longDescription` values).
- Unused imports/vars cleared from three test files and `vite.config.ts`.
- One scoped `eslint-disable` on the auth subscription's `catch`, with the reason written out.

### 16. `npm run check`
Single entry point running lint → typecheck → test → build.

### 17. Package metadata corrected
`react-example` → `catalog-of-futility`; `0.0.0` → `2.0.0` (matching the "Archive // v2.0.0"
the sidebar already displays); added `description`, `engines.node >= 20`, `packageManager`.

### 18. Unused dependency removed
`motion` (v12) was a runtime dependency that no file imports.

### 19. Two drifting lockfiles
`package-lock.json` **and** `pnpm-lock.yaml` were committed; `vercel.json` runs `npm install`.
Standardised on npm — removed the stale pnpm lock and translated `pnpm.overrides` → npm
`overrides` (the `minimatch` pin). Reversible with `git revert` if pnpm is preferred.

---

## C. Accessibility (`docs/ux-foundation.md` §8, WCAG 2.1 AA)

### 20. `prefers-reduced-motion` was specified but never implemented
The spec contains the exact CSS block; `index.css` did not. The CRT scanline, glitch, flicker
and atmosphere animations ran for every visitor regardless of OS setting. Added, covering
those four plus Tailwind's `animate-pulse` / `animate-ping` / `animate-spin` and both
`::view-transition-*` pseudo-elements.

### 21. No global focus fallback
Components set `outline-none` and rely on a `focus-visible:ring` utility; any that forgot were
invisible to keyboard users. Added a global `:focus-visible` outline.

### 22. Nested interactive controls on every catalog card
Cards were `div role="button"` **containing** the tag filter buttons — invalid per WCAG 4.1.2,
and screen readers collapse the card into one control, hiding the tag buttons entirely.
Restructured to `<article>` + a stretched activation `<button>`; tags sit above it at `z-30`.
Keyboard activation is now native, so the hand-rolled Enter/Space handler was deleted.

### 23. Auth-locked cards lied about being disabled
They carried `aria-disabled="true"` while clicking them opens the auth modal. Removed; the
accessible name ("— authentication required") conveys the restriction accurately.

### 24. Card thumbnails no longer duplicate the heading
`alt={entry.title}` next to an `<h3>{entry.title}</h3>` made screen readers announce the title
twice. Now `alt=""` + `aria-hidden="true"`.

### 25. Chamber log panel is now a live region
`role="log"` + `aria-live="polite"` + `aria-relevant="additions"`.

### 26. Chamber fullscreen toggle had no accessible name
Icon-only button, no `aria-label`, no `aria-pressed`. Both added; icon marked `aria-hidden`.

### 27. Chamber noise toggle did not exist on phones
`hidden md:flex` removed the control entirely below `md`. Now always present, with
`aria-label` and `aria-pressed`.

### 28. "View Debugging Guide" was a dead anchor
`<a href="#">` that never navigated. Now a real `<button type="button">`.

### 29. Chamber asset viewer had no focus trap and no focus restore
`aria-modal="true"` with focus free to tab straight into the Chamber behind it, and focus
dropped on `<body>` on close. Both implemented.

### 30. The focus trap could not have worked on these overlays
Both traps filtered candidates on `offsetParent !== null`. That is `null` for **every** element
in jsdom (untestable) and for any `position: fixed` subtree in real browsers — which is exactly
what both modals are. Replaced with a computed-style check, extracted to `src/lib/focus.ts` and
shared by `AuthModal` and `Chamber`. `src/test/focus.test.ts` asserts the fixed-position case.

### 31. AuthModal did not return focus to its opener
Added, with the same `<body>` guard.

### 32. Copy-ID gave no feedback and failed silently
No announcement of the outcome, and `if (!navigator.clipboard) return` left a button that did
nothing at all outside a secure context. Added a `role="status"` region and an explicit
failure message.

### 33. Result count is now announced
"12 of 22 Entries" was inert. Now `role="status"` + `aria-live="polite"`.

### 34. Search gained landmark semantics
`role="search"`, `enterKeyHint="search"`, `autoComplete="off"`, `spellCheck={false}`.

### 35. Explicit `type="button"`
Added to ~20 buttons across Catalog, Chamber, ProductPage and AuthModal that could otherwise
submit a form they are later nested inside.

### 36. Remaining ARIA gaps closed
`aria-busy` on the auth form while submitting; `aria-label` on the Chamber viewport `<section>`;
`::selection` globalised (was Chamber-only); `color-scheme: dark` on `:root`.

---

## D. Behaviour & UX

### 37. Escape threw you out of a fullscreen session
In fullscreen, the first Escape navigated away from the Chamber. Escape is now layered
innermost-first: image modal → fullscreen → view. Two tests cover it.

### 38. Catalog Escape hijacked the keyboard
`resetFilters()` fired on *every* Escape, even with nothing filtered, re-focusing the search
input and announcing an empty live region. Now guarded by `isFilterActiveRef`, and yields to
any open dialog.

### 39. The corruption readout could contradict itself
The label was the literal string `85% CORRUPTION` sitting next to a `corruption` variable.
Interpolated, and both now read `ARCHIVE_CORRUPTION` from `lib/constants.ts` (which also
single-sources `MAX_LOGS`, previously duplicated).

### 40. Privacy banner flashed in one frame late
Consent was read in an effect, so the banner appeared after first paint. Now a lazy state
initializer — correct on the very first render.

### 41. Unconfigured Supabase no longer flashes a loading shell
`loading` / `connectionError` are seeded from initial state instead of assigned in an effect,
removing a cascading second render on every cold start.

### 42. `signOut` could leave the user signed in
It cleared only `profile`; if the network call threw, `user` and `session` stayed set and the UI
kept claiming a signed-in observer. Identity is now cleared first, and the failure is reported.

### 43. `ProductPage` paragraph keys were positional
`key={i}` replaced with a content-derived key.

### 44. Shared links always previewed as the archive root
`App.tsx` updated only `<title>` and `meta[name=description]`; `og:*` and `twitter:*` stayed
pinned to the defaults. Routed through `src/lib/metadata.ts`, which moves all five tags.

### 45. Two different default descriptions
`index.html` and `App.tsx` disagreed. Single-sourced in `lib/constants.ts`; `src/test/site.test.tsx`
asserts the file and the constant agree.

### 46. `index.html` metadata completed
Added `theme-color`, `color-scheme`, `robots`, `og:image`, `twitter:image`, upgraded
`twitter:card` to `summary_large_image`, and linked a new `public/site.webmanifest`.

### 47. No error boundary
Any render throw unmounted the whole tree — a blank page with no explanation and no way back.
Added `src/ErrorBoundary.tsx` with in-brand copy, the error text, a Re-Initialize path and a
reload fallback, wrapped outside `AuthProvider` so an auth-provider throw cannot take the
recovery UI with it.

---

## E. Performance & build

### 48. Vendor code is now cache-stable
One 463.65 kB chunk → 99.51 kB app + 193.83 kB react + 174.16 kB supabase. Note: the first
attempt used `manualChunks`' object shorthand and silently left `react-dom` and `scheduler` in
the app chunk (verified by inspecting the output); the function form used now is confirmed to
move them.

### 49. Layout shift on card and hero images
`width` / `height` (800×600, matching every asset) and `decoding="async"` added.

### 50. `vite.config.ts` dead code removed
Unused `loadEnv` / `env` binding and the empty `define: {}`; `server.host` made explicit.

---

## F. Security

### 51. Electron renderer hardened and token handling fixed
- `BrowserWindow` relied on framework defaults that have changed across Electron majors. Now
  explicit `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`,
  `webSecurity: true`; `setWindowOpenHandler` sends external links to the OS browser;
  `show: false` + `ready-to-show` removes the white flash.
- `bulk_merge_prs.py` took the GitHub token as `argv[1]` — visible to every local user via
  `ps` and recorded in shell history. Now reads `$GITHUB_TOKEN`, uses `argparse`, and exits 1
  with guidance when it is missing (both paths exercised).
- Chamber iframe sends `referrerPolicy="no-referrer"`.

---

## G. Testing & DX

### 52. Test infrastructure and coverage
- `src/test/setup.ts` was `import '@testing-library/react'` — a bare side-effect import that
  registered nothing. It now installs `@testing-library/jest-dom` matchers, deterministic
  cleanup, and an overridable `matchMedia` stub (jsdom has no implementation, which is why the
  reduced-motion branch was previously unreachable from tests).
- The skip-link test passed even when the card click did nothing — the link renders on every
  view. It now asserts the navigation actually happened.
- Card interactions now target the real activation button by accessible name instead of the `<h3>`.
- New suites: `catalog-integrity` (`validateCatalog()`, taxonomy rules, and every `image`/`url`
  path resolving to a real file — the item-3 regression guard), `a11y`, `focus`,
  `error-boundary`, `site` metadata, `reduced-motion`, `auth-transition`.
- `validateCatalog()` added to `data.ts` with a dev-mode console report, so a malformed entry
  surfaces on load instead of presenting as a filter that silently matches nothing.
- **105 → 170 tests, 4 → 11 files.**

---

## Repo hygiene (not counted above)

- **CI written, not yet active** — `docs/ci.workflow.yml`: lint → typecheck → test → build →
  artifact upload, with `ELECTRON_SKIP_BINARY_DOWNLOAD=1` and `concurrency` cancellation. None
  existed before. GitHub only runs workflows from `.github/workflows/`, and the push to that
  path was rejected: *"refusing to allow a GitHub App to create or update workflow
  `.github/workflows/ci.yml` without `workflows` permission"*. `git mv docs/ci.workflow.yml
  .github/workflows/ci.yml` activates it. Until then, `npm run check` runs the same four steps.
- `.vscode/settings.json` was `{}`; now sets the workspace TypeScript SDK and eslint-on-save.
- `.editorconfig` added.
- `.gitignore` extended (`.eslintcache`, `.vite/`, `*.tsbuildinfo`, `.idea/`).

---

## Checked and deliberately left alone

- **`public/robots.txt`** — I initially rewrote this and dropped its live `Sitemap:` directive.
  Reverted to the committed version; it was already correct.
- **`data.ts` escape sequences** — I suspected the `ibt2` `longDescription` was rendering
  literal `\n` and `\"`. It is not: the file is byte-identical to `HEAD` in that region and all
  22 `longDescription` values render identically. Only two *redundant* escapes existed, and
  removing them was verified not to change the output.
- **`public/sitemap.xml`** — uses a relative `<loc>/</loc>`, which the sitemaps protocol
  requires to be absolute. Left as-is because the production domain is not knowable from here.
- **`og:image` / `twitter:image`** point at the same GitHub-hosted banner the README already
  uses, so no new binary asset is committed.
- **Tailwind opacity utilities** such as `bg-white/8` were suspected invalid (they are not on
  the v3 scale). Verified in the built CSS: v4 emits them correctly via `color-mix`.

---

*The void is never finished, only abandoned.*
