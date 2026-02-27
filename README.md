<div align="center">
<img width="1200" height="475" alt="Catalog of Futility Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-4554-a0b5-a7a51a8e05ce" />
</div>

# Catalog of Futility

A brutalist web application for hosting and curating single-file HTML apps and games. Features an atmospheric void-themed UI with CRT effects, parallax card animations, and an immersive "Chamber" viewport for running embedded experiences.

---

## Features

- **Brutalist Design** — Dark, atmospheric UI with noise overlays, vignette effects, and terminal-inspired aesthetics
- **App Catalog** — Grid-based gallery with hover parallax effects, search functionality, and filter tags
- **Chamber Viewport** — Dedicated iframe sandbox for running embedded HTML apps with fullscreen support
- **Hotlink Interception** — Click any image in an embedded app to view it in a modal overlay
- **Responsive Layout** — Adaptive sidebar navigation and mobile-friendly design
- **Type-Safe** — Built with TypeScript and React 19

---

## Tech Stack

| Technology | Version |
|------------|---------|
| React | 19.0.0 |
| Vite | 6.2.0 |
| TypeScript | 5.8.2 |
| Tailwind CSS | 4.1.14 |
| Motion | 12.23.24 |
| Lucide React | 0.546.0 |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd catalogoffutility
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional)**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   APP_URL="http://localhost:3000"
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

---

## Project Structure

```
catalogoffutility/
├── public/                     # Static assets (HTML files for embedded apps)
│   ├── 235am_v2.html
│   ├── abm-generator.html
│   ├── aria-terminal-v2.html
│   ├── chatgg.html
│   ├── entropy-budget.html
│   ├── genesis.html
│   ├── kira-v2.html
│   ├── ludic-strata.html
│   ├── narrative-beat-graph.html
│   ├── nexus-war.html
│   ├── offensive-letters.html
│   ├── quantum-ant.html
│   ├── soul-mirror.html
│   ├── space-time-curvature.html
│   ├── spectral_loop.html
│   ├── warren-invader.html
│   ├── when-the-sun-died.html
│   └── world-that-doesnt-care.html
├── src/
│   ├── App.tsx                # Root component with routing logic
│   ├── Catalog.tsx            # Main catalog grid with search & filters
│   ├── Chamber.tsx            # Viewport component for running embedded apps
│   ├── ProductPage.tsx        # Product detail page
│   ├── data.ts                # App entries registry & types
│   ├── index.css              # Global styles
│   ├── main.tsx               # Entry point
│   └── test/
│       ├── chains.test.tsx    # Logic chain tests
│       └── setup.ts           # Test configuration
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind configuration
├── vercel.json                # Vercel deployment config
└── package.json
```

---

## Adding Your Own HTML Apps/Games

Apps are registered in `src/data.ts`. Two methods are supported:

### Option 1: Inline HTML

Provide the raw HTML string directly in the `htmlContent` property:

```typescript
{
  id: "my-inline-app",
  title: "My App",
  description: "An inline HTML app",
  image: "https://...",
  htmlContent: `<html>...</html>`,
}
```

### Option 2: External File (Recommended)

1. Place your `.html` file in the `public/` directory
2. Reference it via the `url` property:

```typescript
{
  id: "my-external-app",
  title: "My App",
  description: "An external HTML app",
  size: "512 KB",
  version: "v1.0",
  image: "https://...",
  url: "/my-app.html",
}
```

### Entry Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✓ | Unique identifier |
| `title` | string | ✓ | Display title |
| `description` | string | ✓ | App description |
| `image` | string | ✓ | Card thumbnail URL |
| `url` | string | ✗ | Path to HTML file in `/public` |
| `htmlContent` | string | ✗ | Inline HTML string |
| `version` | string | ✗ | Version badge (e.g., `"v1.0"`) |
| `size` | string | ✗ | File size metadata |
| `tags` | string[] | ✗ | Filter tags (e.g., `["Narrative", "Interactive"]`) |
| `tech` | string[] | ✗ | Technologies used (e.g., `["HTML", "Canvas"]`) |
| `longDescription` | string | ✗ | Extended description for product page |
| `missing` | boolean | ✗ | Shows locked state if `true` |

> **Note:** For security reasons, users cannot upload HTML files through the UI. All apps must be added by editing `src/data.ts` and placing files in `public/`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Type-check with TypeScript |
| `npm run clean` | Remove `dist/` directory |

---

## Deployment

### Vercel

This project includes `vercel.json` for zero-config deployment:

```bash
vercel deploy --prod
```

### Manual Build

```bash
npm run build
# Deploy the contents of dist/ to your hosting provider
```

---

## Customization

### Theme

The brutalist aesthetic is achieved through:

- **CSS Classes:** Tailwind utilities with custom opacity/blur effects
- **Atmospheric Overlays:** CSS gradients, noise textures, and vignette layers
- **Typography:** Space Grotesk (display) + Material Symbols (icons)

To modify the theme, edit the Tailwind configuration or override CSS variables in `index.html`.

### System Logs

The "Void Logs" sidebar in `Chamber.tsx` displays atmospheric messages. Customize the initial logs array or dynamically inject new entries via the "Inject Log" button.

---

## Included Apps (18 Total)

| App | Tags | Description |
|-----|------|-------------|
| **WHEN THE SUN DIED** | Narrative, Endless | Cosmic tragedy terminal experience |
| **ARIA // TERMINAL** | Pointless, Interactive | Remote session with something listening |
| **KIRA** | Narrative, Endless, Interactive | She texts back. Always. |
| **NARRATIVE BEAT GRAPH** | Tool, Pointless | Map story structure visually |
| **2:35 AM** | Endless, Corrupted | 3D walk through the hour of dread |
| **THE WORLD THAT DOESN'T CARE** | Simulation, Endless, Pointless | A simulation running without you |
| **CHATGG** | Interactive, Pointless | Conversation with something from the void |
| **ENTROPY BUDGET** | Simulation, Endless | Spend your finite order wisely |
| **GENESIS ENGINE** | Simulation, Interactive | World-building simulation |
| **LUDIC STRATA** | Narrative, Interactive | Deterministic conversational engine |
| **OFFENSIVE LETTERS** | Interactive, Corrupted | Typing game for the damned |
| **CURVATURE CARTOGRAPHER** | Tool, Simulation | Spacetime visualization |
| **SPECTRAL LOOP** | Narrative, Endless, Corrupted | A transmission that repeats |
| **WARREN: INVASION PROTOCOL** | Interactive, Endless | Arcade defense game |
| **SOUL MIRROR** | Tool, Interactive | Reflect on core concepts of existence |
| **ABM GENERATOR** | Tool, Interactive | Atmospheric Black Metal generator |
| **NEXUS WAR** | Interactive, Strategy | Strategic board game |
| **QUANTUM ANT** | Simulation, Endless | Quantum consciousness visualization |

---

## Logic Chains

This application is built around **15 deterministic logic chains** — each a self-contained state machine with explicit triggers, transitions, invariants, and resolution states. Chains are tested in `src/test/chains.test.tsx`.

### Chain Index

| Chain | Name | Location | Trigger | Invariant |
|-------|------|----------|---------|-----------|
| 1 | BrowseFilter | `Catalog.tsx` | Search input / tag click | Search trims whitespace; tag filter is deterministic and pure |
| 2 | AppSelection | `App.tsx` + `Catalog.tsx` | Card click | Missing entries are never navigated to; single authoritative guard in App |
| 3 | ProductReveal | `ProductPage.tsx` | Component mount | Revealed becomes true after ~80ms; before that opacity-0 |
| 4 | ParagraphSplit | `ProductPage.tsx` | Render with longDescription | Paragraphs split on actual `\n\n`, not literal `\\n\\n` |
| 5 | ChamberInit | `Chamber.tsx` | Initialize button click | Resets error+loading state; log appears after 2000ms; idempotent |
| 6 | IframeLoad | `Chamber.tsx` | iframe `onLoad` event | Loading spinner shown; no duplicate listeners (dedup via ref) |
| 7 | IframeError | `Chamber.tsx` | iframe `onError` event | Initial logs present; debug guide logs warning not promise |
| 8 | ImageHotlink | `Chamber.tsx` | `postMessage` from iframe | Origin validated; empty src rejected; valid src shows modal |
| 9 | EnterChamber | `App.tsx` | "Enter Chamber" button | Chamber only entered when selectedApp is non-null |
| 9b | FullscreenToggle | `Chamber.tsx` | Fullscreen button click | Button appears only post-init; toggle is its own inverse |
| 10 | NoiseToggle | `Chamber.tsx` | NOISE button click | Noise enabled by default; toggle changes button appearance |
| 11 | LogAppend | `Chamber.tsx` | Inject Log / Transmission Blocked | Log array capped at MAX_LOGS=100; oldest entries evicted |
| 12 | BackNavigation | `App.tsx` | Back/Cease button | Back from chamber → product; back from product → catalog (selectedApp cleared) |
| 13 | HTMLContentInjection | `Chamber.tsx` | Render with htmlContent | Script inserted before `</body>`; appended when no `</body>` |
| 14 | NavButtonActions | `Catalog.tsx` | Sidebar nav buttons | Nav buttons emit non-blocking notifications; `alert()` must never fire |

### Chain Architecture

Each chain follows the pattern:

```
Trigger → ordered state transitions → terminal resolution (± side effects)
```

**Key principles:**

- **Deterministic transitions** — No hidden state or race conditions
- **Invariants enforced at correct layer** — Presenter guards in `App.tsx`, domain logic in components
- **Failures typed and observable** — Error states surface in UI with details
- **Side effects isolated** — postMessage validation, log capping, notification auto-dismiss
- **Tests prove the contract** — Each chain has dedicated test suite

### Running Chain Tests

```bash
npm run test
# or
npx vitest run src/test/chains.test.tsx
```

---

## License

MIT

---

<div align="center">
  <sub>Built with ◈ for the void</sub>
</div>
