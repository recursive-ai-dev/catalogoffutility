<div align="center">
<img width="1200" height="475" alt="Catalog of Futility Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-4554-a0b5-a7a51a8e05ce" />
</div>

# Catalog of Futility

A brutalist web application for hosting and curating single-file HTML apps and games. Features an atmospheric void-themed UI with CRT effects, parallax card animations, and an immersive "Chamber" viewport for running embedded experiences.

**Live Demo:** [View in AI Studio](https://ai.studio/apps/25d0ccd9-b443-4954-a0b5-a7a51a8e05ce)

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

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
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
│   └── when-the-sun-died.html
├── src/
│   ├── App.tsx                # Root component with routing logic
│   ├── Catalog.tsx            # Main catalog grid with search & filters
│   ├── Chamber.tsx            # Viewport component for running embedded apps
│   ├── data.ts                # App entries registry & types
│   └── main.tsx               # Entry point
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

## Included Example

**WHEN THE SUN DIED** (`v1.0`)
- A cosmic tragedy terminal experience
- Located at: `/public/when-the-sun-died.html`
- Demonstrates iframe embedding with hotlink interception

---

## License

MIT

---

<div align="center">
  <sub>Built with ◈ for the void</sub>
</div>
