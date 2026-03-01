# UX Foundation — Catalog of Futility

**Document type:** UX-D1 · Experience Framework
**Product type:** Tool / Content Catalog
**User maturity:** Mixed (wanderers, tinkerers, creators)
**Accessibility mandate:** WCAG 2.1 AA
**Last updated:** 2026-03-01

---

## Context

Catalog of Futility is a brutalist curator of single-file HTML experiences — games, simulations, tools, and narrative engines. The interaction model is discovery-forward: users arrive without a specific goal, are seduced by atmosphere, and descend into individual experiences through a three-stage funnel (Browse → Inspect → Enter). The brand voice is existential, literary, and deliberately anti-commercial.

---

## 1. UX Pillars

These seven pillars govern every interaction decision across the product.

---

### Pillar 1 — Atmosphere is the First Interaction

> The void speaks before the UI does.

The emotional register is established at page load, not at first click. Noise overlays, ambient gradients, CRT scanlines, and typographic weight communicate before any content is read. Every component contributes to a unified sensory contract: this is not a SaaS dashboard; it is an archive.

**Governing rules:**
- All transitions use `ease-in-out` curves with deliberate duration (200–400 ms). No snap transitions.
- Background always renders before foreground content. The atmosphere layer (`radial-gradient` + `blur`) must never be skipped or deferred.
- Motion is purposeful and sparse. Animations convey state change, not decoration. The one exception is the CRT scanline — it is pure atmosphere and runs always.
- Sound: none by default. Individual entries own their audio contracts.

**Applies to:** `index.css` (`.atmosphere`, `.crt-overlay`), catalog card hover states, Chamber initialization sequence.

---

### Pillar 2 — Progressive Revelation

> Show enough to intrigue; withhold enough to compel descent.

Information is layered across three levels — card, product page, Chamber — with each level revealing more without front-loading the final level's complexity onto the first.

| Level | Component | What is revealed |
|---|---|---|
| L1 – Browse | `CatalogCard` | Title, thumbnail, 1-sentence hook, tag(s) |
| L2 – Inspect | `ProductPage` | Full description, tech stack, version, size, Enter CTA |
| L3 – Execute | `Chamber` | Live experience, system logs, fullscreen, noise toggle |

**Governing rules:**
- `longDescription` is never shown on the catalog card. Even a compelling excerpt is forbidden; the card is a lure, not a summary.
- The "Enter Chamber" CTA appears only on the product page, not on the card. This enforces the funnel; it prevents skipping Inspect.
- Missing/locked entries (`missing: true`, `requiresAuth: true`) display a locked state on the card — never navigate silently away. The lock is itself informative.
- Onboarding scaffolding: new visitors have no onboarding modal. The catalog grid *is* the onboarding. Each card's image, title, and tag constitute the entire ramp.

---

### Pillar 3 — Purposeful Friction

> Resistance is not a bug; it is part of the experience.

Some delay and resistance is intentional — it mirrors the existential weight of the content. Chamber initialization requires a button press and a 2-second log delay before the iframe resolves. This is not latency; it is ceremony.

**Governing rules:**
- The Chamber "Initialize" button must always be present. Auto-play on mount is forbidden — the user must choose to begin.
- Error states in the Chamber (IframeError chain) are surfaced with dramatic text, not dismissible toasts. The error is part of the narrative fabric.
- Authentication gates must be clearly legible: locked card UI with explicit "Restricted access" copy — never a silent redirect or a 404.
- Friction must never block escape. Every friction point has a clear exit (back nav, re-initialize, close modal).

---

### Pillar 4 — Sanctuary of Focus

> The Chamber is a clean room. Nothing else enters.

When a user enters the Chamber, the entire surrounding UI collapses. Sidebar, search, catalog — gone. The experience consumes the viewport. Control affordances (back, fullscreen, noise toggle, logs) live at the periphery and fade into the darkness unless needed.

**Governing rules:**
- Chamber must render as the sole child in the view hierarchy (enforced by `view === "chamber"` gate in `App.tsx`).
- Control bar elements (fullscreen, noise, back) appear only post-initialization. Pre-init, the space is fully bare except for the Initialize button.
- The Void Logs sidebar is opt-in context, not primary content. It should never occlude the iframe.
- Fullscreen toggle removes even the control bar from view. A minimal escape affordance (keyboard `Esc`, browser native fullscreen exit) must remain discoverable.
- The noise overlay has a toggle (`NOISE` button) because some embedded apps have their own visual language that can conflict. User override is always respected.

---

### Pillar 5 — Text as Interface

> Words are not labels; they are the material.

Typography carries the primary expressive load. Every string — title, description, system log, error message, button label — is crafted, not generated. UX copy and brand copy are indistinguishable.

**Governing rules:**

| Context | Font | Style |
|---|---|---|
| Catalog titles | Cormorant Garamond | All-caps, tracked |
| Body / meta | Inter | Light weight, subdued opacity |
| System logs, tags, technical labels | JetBrains Mono | `text-[9px]–text-[11px]`, `tracking-widest`, uppercase |

- Button labels are never generic (`Submit`, `OK`, `Cancel`). They are contextual and tonal: `IDENTIFY YOURSELF`, `ENTER CHAMBER`, `CEASE`, `RE-INITIALIZE`.
- Error copy adopts the atmospheric register, not technical language. An iframe error reads as a narrative event, not a stack trace.
- Tag names form a controlled vocabulary (see §5 Content Strategy). No ad-hoc tags.

---

### Pillar 6 — Escape Is Always Possible

> No traps. The void does not cage.

Navigation is always reversible and predictable. The user can move backwards at every stage without losing context. The flow is linear but never one-way.

**Governing rules:**
- **Catalog → Product → Chamber** is the forward path. The back path is **Chamber → Product → Catalog**.
- "Back" from Chamber returns to the Product page (not the Catalog). The selected app is preserved.
- "Back" from the Product page returns to the Catalog and clears selection.
- Auth-gated views compute their effective state during render — never after paint — to prevent protected content from flashing before a redirect occurs.
- Browser back button behavior must be equivalent to the in-app back button. If routing doesn't use the history API, state is scoped entirely to the session with no URL-change side effects.
- No dead ends. Missing entries are navigable to their card but no further. Locked entries show the auth gate, which has a clear call-to-action.

---

### Pillar 7 — Honest Metadata

> No dark patterns. The catalog tells the truth.

Every data point shown to the user (`size`, `version`, `tech`, `tags`) is accurate and useful. The catalog does not oversell. Descriptions are evocative but never misleading about what an experience actually does.

**Governing rules:**
- `missing: true` entries are never hidden from the grid. Scarcity and absence are part of the catalog's texture.
- `version` badges signal iteration; they are always formatted as `v.X.Y`.
- `size` is shown so users with constrained connections can make informed choices inside the Chamber.
- `requiresAuth` entries must visually signal restricted access *before* the user selects them — not after.
- Tags must come from the controlled vocabulary below. Tags are never stacked more than 4 per entry.

---

## 2. Information Architecture

### Hierarchy

```
Root (AuthProvider + view router)
│
├── Catalog                    [Browse layer — L1]
│   ├── SidebarNav             (filter tags, user identity, nav actions)
│   ├── SearchBar              (free-text, debounced, trims whitespace)
│   ├── CatalogGrid            (responsive card layout)
│   │   ├── CatalogCard        (hover parallax, locked state, tag badges)
│   │   └── ...
│   ├── AuthModal              (overlay, conditional)
│   └── PrivacyBanner          (persistent, dismissible)
│
├── ProductPage                [Inspect layer — L2]
│   ├── HeroImage
│   ├── MetaPanel              (version, size, tags, tech stack)
│   ├── DescriptionBlock       (short + long description, paragraph split)
│   ├── EnterChamberCTA        (primary action)
│   └── BackButton
│
└── Chamber                    [Execute layer — L3]
    ├── ControlBar             (back, fullscreen, noise toggle)
    ├── IframeSandbox          (sandboxed execution environment)
    ├── VoidLogsSidebar        (atmospheric system log, max 100 entries)
    ├── ImageHotlinkModal      (postMessage-triggered image overlay)
    └── ErrorState             (IframeError recovery)
```

### IA Principles

1. **Flat taxonomy over nested hierarchy.** Tags are the only organizational layer on top of the flat catalog list. No folders, categories, or sub-catalogs.
2. **One canonical entry per experience.** An app appears once. No duplication for "featured" or "new" — the sort order and visual weight handle prominence.
3. **Search and filter are additive, not exclusive.** A text search combined with a tag filter narrows results; it does not replace one mode with another.
4. **The data layer (`data.ts`) is the single source of truth.** No derived catalogs, no user-curated lists, no backend sorting. Order in `CATALOG_ENTRIES` is the display order.

---

## 3. Component Hierarchy & Roles

| Component | Layer | Role | Key constraint |
|---|---|---|---|
| `App.tsx` | Shell | View router + auth guard | Derives `effectiveView` from render state, never sets state during render |
| `Catalog.tsx` | L1 | Browse + filter | BrowseFilter chain: search trims whitespace, tag filter is pure |
| `ProductPage.tsx` | L2 | Detail + CTA | ProductReveal chain: opacity-0 before ~80ms mount; ParagraphSplit on `\n\n` |
| `Chamber.tsx` | L3 | Execution sandbox | IframeLoad deduplication via ref; log capped at MAX_LOGS=100 |
| `AuthModal.tsx` | Overlay | Identity gate | Appears only when `authModalVisible` is true; never self-dismisses |
| `PrivacyBanner.tsx` | Overlay | Consent notice | Persistent until dismissed; renders beneath all functional UI |
| `lib/auth.tsx` | Provider | Auth context | Wraps root; provides `user`, `profile`, `showAuthModal`, `signOut` |
| `lib/supabase.ts` | Service | Supabase client | Fails fast in production when credentials are absent |

---

## 4. Navigation Patterns

### Primary Navigation Model: Linear Progressive Flow

```
[Catalog] ──select──▶ [Product Page] ──enter──▶ [Chamber]
    ◀────────back────────────────────────◀back────────────
```

- **Forward** is always triggered by an explicit user action (card click, "Enter Chamber" button).
- **Back** is always triggered by "Back" / "Cease" button or equivalent affordance.
- No breadcrumbs. The three-level hierarchy is shallow enough that breadcrumbs add noise without value.

### Sidebar Navigation (Catalog only)

The sidebar contains:
- Tag filters (Pillar 2: filter by controlled vocabulary)
- User identity section (Pillar 7: honest auth state)
- Nav action buttons (non-blocking notifications; never `alert()`)

Sidebar actions (`About`, `Submit`, etc.) must emit toast-style non-blocking notifications. They must never fire `alert()`.

### Modal Navigation

- `AuthModal` overlays the Catalog only. It cannot be triggered from Product or Chamber.
- `ImageHotlinkModal` overlays the Chamber only. It is triggered exclusively by validated `postMessage` from the iframe (origin check + non-empty src).
- Modals must never stack. Only one overlay can be visible at a time.

---

## 5. Content Strategy

### Tag Taxonomy (Controlled Vocabulary)

| Tag | Meaning |
|---|---|
| `Narrative` | Story-forward, text-driven, lore-heavy |
| `Endless` | No win state; session continues indefinitely |
| `Interactive` | Direct user input shapes the experience |
| `Simulation` | Models a system; emergent behavior |
| `Tool` | Functional utility with practical output |
| `Corrupted` | Intentionally glitched, broken, or degraded aesthetics |
| `Pointless` | Deliberately without purpose or progress |
| `Strategy` | Decision trees, resource allocation, planning |
| `Horror` | Dread-adjacent; psychological or atmospheric fear |

**Rules:**
- Maximum 4 tags per entry.
- Tags must be chosen from this list only.
- `Pointless` and `Tool` cannot appear together (contradiction).

### Copy Register

| Context | Tone | Example |
|---|---|---|
| Catalog card description | Terse, evocative, second-person | *"Something on the other end is listening."* |
| Product long description | Literary, first-person cosmic, multi-paragraph | *"There are moments when the universe makes a sound…"* |
| System logs (Chamber) | Dry, procedural, slightly ominous | *"TRANSMISSION ESTABLISHED. SIGNAL INTEGRITY: 47%."* |
| Error messages | Matter-of-fact with existential undertone | *"The connection has failed. Some things cannot be initialized."* |
| Button labels | Imperative, contextual, never generic | `ENTER CHAMBER`, `CEASE`, `RE-INITIALIZE`, `IDENTIFY YOURSELF` |
| Auth copy | Honest about restriction; not apologetic | *"Unverified · Restricted access"* |

### Content Anti-Patterns

- Generic button labels (`Submit`, `OK`, `Cancel`, `Close`)
- Marketing language in descriptions (*"powerful," "easy," "seamless"*)
- Excessive punctuation for dramatic effect (the tone does the work, not `!!!`)
- Long descriptions that spoil the experience (leave the ending open)
- System log messages that read as debugging output rather than atmospheric events

---

## 6. Anti-Patterns to Avoid

These are explicitly forbidden interaction patterns that break the experience contract.

| Anti-pattern | Why it breaks | Correct approach |
|---|---|---|
| Setting state during render to block auth-gated views | Causes a one-frame flash of protected content before redirect | Derive `effectiveView` from render state synchronously |
| `alert()` in nav button handlers | Breaks the brutalist immersion; blocks the tab | Emit non-blocking toast notifications or log entries |
| Auto-playing Chamber on mount | Removes ceremony; violates Pillar 3 | Require Initialize button press; run 2-second log delay |
| Stacking modals | Disorienting; z-index warfare | Only one overlay at a time; AuthModal and ImageHotlinkModal are mutually exclusive by view |
| Navigating to a `missing: true` entry | Breaks the locked-state promise | Guard in `App.tsx` (`handleSelectApp` early return) |
| Uncapped log arrays | Memory growth; eventually slows Chamber | Enforce `MAX_LOGS = 100`; evict oldest on overflow |
| Supabase client silently swallowing missing credentials | Fails late and mysteriously in production | Fail fast with a thrown error in production; log + use placeholder in development |
| Duplicate iframe `onLoad` listeners | Double-fires load chain; corrupts log timing | Deduplicate via ref |
| Tag outside controlled vocabulary | Catalog inconsistency; filter breaks expectations | Validate tags against `FILTER_TAGS` at the data layer |
| Tooltip stacking on dark cards | Obscures atmosphere; creates noise | No tooltips on catalog cards; metadata lives on the Product page |

---

## 7. Telemetry Hooks

These measurement points map directly to the 14 logic chains and the three-level funnel. All events are named in the format `domain:action`.

### Funnel Metrics

| Event | Trigger | Measures |
|---|---|---|
| `catalog:loaded` | Catalog component mount | Session start baseline |
| `catalog:app_selected` | Card click → Product view | Catalog → Product conversion rate |
| `chamber:entered` | "Enter Chamber" button → Chamber view | Product → Chamber conversion rate |
| `chamber:initialized` | Initialize button click | Chamber initialization rate |

**Derived KPI:** Time-to-first-chamber = `chamber:initialized.timestamp - catalog:loaded.timestamp`

### Engagement Metrics

| Event | Trigger | Measures |
|---|---|---|
| `catalog:search_used` | Search input non-empty after debounce | Search adoption |
| `catalog:filter_applied` | Tag filter click (excluding "All_Entries") | Filter adoption by tag |
| `catalog:filter_cleared` | Tag filter → "All_Entries" | Filter abandonment |
| `chamber:fullscreen_toggled` | Fullscreen button click | Immersive mode engagement |
| `chamber:noise_toggled` | NOISE button click | Noise toggle usage |
| `chamber:log_injected` | "Inject Log" button click | System log interaction |
| `chamber:image_hotlinked` | Validated postMessage → modal open | Hotlink feature discovery |

### Error & Recovery Metrics

| Event | Trigger | Measures |
|---|---|---|
| `chamber:iframe_error` | IframeError chain fired | Error rate by entry |
| `chamber:reinitialized` | "Re-Initialize" after error | Recovery success rate |
| `auth:gate_encountered` | `requiresAuth` entry selected while logged out | Auth gate exposure rate |
| `auth:modal_opened` | AuthModal becomes visible | Auth funnel entry |
| `auth:signup_completed` | Successful auth flow | Auth funnel conversion |
| `auth:gate_abandoned` | Auth modal closed without completing | Auth funnel abandonment rate |

### Usability Benchmarks

| Metric | Measurement | Target |
|---|---|---|
| Time-on-task (reach Chamber) | `chamber:initialized` − `catalog:loaded` | < 60 seconds for returning users |
| Catalog abandonment rate | Sessions with 0 `catalog:app_selected` events | < 35% |
| Chamber error rate | `chamber:iframe_error` / `chamber:initialized` | < 5% |
| Auth gate conversion | `auth:signup_completed` / `auth:gate_encountered` | > 15% |
| Back-without-entering rate | `catalog:app_selected` without `chamber:entered` | Diagnostic, not targeted (reveals browse intent) |
| Search-to-selection lift | `catalog:app_selected` rate when search is active vs. inactive | Should be ≥ 1.5× |

---

## 8. Accessibility Mandate

**Target:** WCAG 2.1 Level AA

| Area | Requirement | Implementation note |
|---|---|---|
| Color contrast | ≥ 4.5:1 for normal text; ≥ 3:1 for large text | `--color-primary: #e0d8d0` on `#000000` passes (≈ 14.7:1); subdued UI text at `white/20` does NOT — use for decorative only |
| Keyboard navigation | All interactive elements reachable via `Tab`; logical tab order | Sidebar → Search → Grid → Card CTAs |
| Focus indicators | Visible focus ring on all focusable elements | Never `outline: none` without a custom replacement |
| Screen reader | Semantic HTML; ARIA labels on icon-only buttons | Material Symbols icons need `aria-label` or `aria-hidden` + adjacent text |
| Motion | Respect `prefers-reduced-motion` | CRT overlay and glitch animations must pause; parallax must cease |
| iframe accessibility | Chamber iframe must have `title` attribute | Required by WCAG 4.1.2 |
| Auth modal | Focus must trap inside modal when open; restore on close | Standard modal ARIA pattern |
| Images | All `<img>` must have `alt` text; decorative images use `alt=""` | Catalog card thumbnails need meaningful alt |

### Reduced Motion Implementation

```css
@media (prefers-reduced-motion: reduce) {
  .crt-overlay,
  .glitch-hover:hover,
  .atmosphere {
    animation: none;
    transition: none;
  }
}
```

---

*Built with ◈ for the void.*
