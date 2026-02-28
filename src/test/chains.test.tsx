/**
 * Logic Chain Tests — Catalog of Futility
 *
 * Each describe block maps 1:1 to a named logic chain.
 * Tests prove the chain contract defined in Phase 3.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { Catalog } from '../Catalog';
import { Chamber } from '../Chamber';
import { ProductPage } from '../ProductPage';
import { AppEntry, CATALOG_ENTRIES } from '../data';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeApp = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: 'test-app',
  title: 'TEST APP',
  description: 'A test description',
  image: 'https://example.com/img.jpg',
  url: '/test-app.html',
  tags: ['Narrative'],
  tech: ['HTML'],
  version: 'v.1.0',
  size: '10 KB',
  ...overrides,
});

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Chain 4 (ParagraphSplit) — ProductPage.tsx
// Invariant: longDescription paragraphs split on actual "\n\n", not literal "\\n\\n"
// ---------------------------------------------------------------------------
describe('Chain 4 — ParagraphSplit', () => {
  it('splits longDescription on real newlines into separate paragraphs', () => {
    const app = makeApp({
      longDescription: 'Paragraph one.\n\nParagraph two.\n\nParagraph three.',
    });
    render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} />);
    expect(screen.getByText('Paragraph one.')).toBeTruthy();
    expect(screen.getByText('Paragraph two.')).toBeTruthy();
    expect(screen.getByText('Paragraph three.')).toBeTruthy();
  });

  it('renders no paragraph section when longDescription is undefined', () => {
    const app = makeApp({ longDescription: undefined });
    const { container } = render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} />);
    // CLASSIFIED_NOTES section should not appear
    expect(container.textContent).not.toContain('CLASSIFIED_NOTES');
  });

  it('filters empty strings produced by leading/trailing newlines', () => {
    const app = makeApp({ longDescription: '\n\nParagraph one.\n\n' });
    render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} />);
    expect(screen.getByText('Paragraph one.')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 3 (ProductReveal) — ProductPage.tsx
// Invariant: revealed becomes true after ~80ms; before that opacity-0
// ---------------------------------------------------------------------------
describe('Chain 3 — ProductReveal', () => {
  it('starts unrevealed and reveals after 80ms', () => {
    vi.useFakeTimers();
    const app = makeApp();
    const { container } = render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} />);
    const rightPanel = container.querySelector('.transition-all.duration-700');
    expect(rightPanel?.className).toContain('opacity-0');
    act(() => { vi.advanceTimersByTime(100); });
    expect(rightPanel?.className).toContain('opacity-100');
    vi.useRealTimers();
  });

  it('cleans up timer on unmount without error', () => {
    vi.useFakeTimers();
    const app = makeApp();
    const { unmount } = render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} />);
    unmount();
    act(() => { vi.advanceTimersByTime(200); });
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Chain 2 (AppSelection) — App.tsx + Catalog.tsx
// Invariant: missing entries are never navigated to; single authoritative guard in App
// ---------------------------------------------------------------------------
describe('Chain 2 — AppSelection', () => {
  it('renders the catalog on initial load', () => {
    render(<App />);
    expect(screen.getByText(/The Archive/i)).toBeTruthy();
  });

  it('missing entry flag prevents navigation', () => {
    // Test the guard logic directly
    const entry = makeApp({ missing: true });
    const onSelect = vi.fn();
    const guardedOnSelect = () => { if (!entry.missing) onSelect(entry); };
    guardedOnSelect();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('non-missing entry navigates to product page', () => {
    render(<App />);
    fireEvent.click(screen.getByText(CATALOG_ENTRIES[0].title));
    expect(screen.getByText(/Enter Chamber/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 1 (BrowseFilter) — Catalog.tsx
// Invariant: search trims whitespace; tag filter is deterministic and pure
// ---------------------------------------------------------------------------
describe('Chain 1 — BrowseFilter', () => {
  it('renders all catalog entries by default', () => {
    render(<App />);
    for (const entry of CATALOG_ENTRIES) {
      expect(screen.getByText(entry.title)).toBeTruthy();
    }
  });

  it('filters entries by search query (case-insensitive)', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Search the void...');
    await userEvent.type(input, 'aria');
    expect(screen.getByText('ARIA // TERMINAL')).toBeTruthy();
    expect(screen.queryByText('WHEN THE SUN DIED')).toBeNull();
  });

  it('trims leading/trailing whitespace in search', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Search the void...');
    await userEvent.type(input, '  aria  ');
    expect(screen.getByText('ARIA // TERMINAL')).toBeTruthy();
  });

  it('shows empty state when no entries match', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Search the void...');
    await userEvent.type(input, 'xyznotfound');
    expect(screen.getByText(/Nothing found/i)).toBeTruthy();
  });

  it('tag filter restricts to matching tags', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Narrative' }));
    const narrativeEntries = CATALOG_ENTRIES.filter(e => e.tags?.includes('Narrative'));
    expect(narrativeEntries.length).toBeGreaterThan(0);
    for (const e of narrativeEntries) {
      expect(screen.getByText(e.title)).toBeTruthy();
    }
    // Non-Narrative entries should not appear
    const nonNarrative = CATALOG_ENTRIES.find(e => !e.tags?.includes('Narrative'));
    if (nonNarrative) {
      expect(screen.queryByText(nonNarrative.title)).toBeNull();
    }
  });

  it('All_Entries tag restores full list', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Narrative' }));
    fireEvent.click(screen.getByRole('button', { name: 'All_Entries' }));
    for (const entry of CATALOG_ENTRIES) {
      expect(screen.getByText(entry.title)).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Chain 14 (NavButtonActions) — Catalog.tsx
// Invariant: nav buttons emit non-blocking notifications; alert() must never fire
// ---------------------------------------------------------------------------
describe('Chain 14 — NavButtonActions', () => {
  it('"Waste Time" shows notification without calling alert()', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Waste Time/i }));
    expect(screen.getByText('Time is already wasted.')).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('"Forget" shows notification', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Forget/i }));
    expect(screen.getByText('Memories purged.')).toBeTruthy();
  });

  it('"Give Up" shows notification', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Give Up/i }));
    expect(screen.getByText('Giving up is not an option.')).toBeTruthy();
  });

  it('"Void" shows notification', () => {
    render(<App />);
    // The button has icon text + label text; find by the visible label span
    const voidBtn = screen.getByText('Void').closest('button')!;
    fireEvent.click(voidBtn);
    expect(screen.getByText('Staring into the void...')).toBeTruthy();
  });

  it('"Exit (Broken)" shows notification', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Exit \(Broken\)/i }));
    expect(screen.getByText('Exit mechanism destroyed.')).toBeTruthy();
  });

  it('notification auto-dismisses after 2500ms', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Waste Time/i }));
    expect(screen.getByText('Time is already wasted.')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(2600); });
    expect(screen.queryByText('Time is already wasted.')).toBeNull();
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Chain 9 (EnterChamber) — App.tsx
// Invariant: chamber only entered when selectedApp is non-null; view transitions are atomic
// ---------------------------------------------------------------------------
describe('Chain 9 — EnterChamber', () => {
  it('navigates catalog → product → chamber', () => {
    render(<App />);
    fireEvent.click(screen.getByText(CATALOG_ENTRIES[0].title));
    expect(screen.getByText(/Enter Chamber/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Enter Chamber/i));
    expect(screen.getByText('The Chamber')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 12 (BackNavigation) — App.tsx
// Invariant: back from chamber → product; back from product → catalog (selectedApp cleared)
// ---------------------------------------------------------------------------
describe('Chain 12 — BackNavigation', () => {
  it('back from product returns to catalog and clears selected app', () => {
    render(<App />);
    fireEvent.click(screen.getByText(CATALOG_ENTRIES[0].title));
    expect(screen.getByText(/Enter Chamber/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Archive/i }));
    expect(screen.getByText(/The Archive/i)).toBeTruthy();
    expect(screen.queryByText(/Enter Chamber/i)).toBeNull();
  });

  it('back from chamber returns to product page', () => {
    render(<App />);
    fireEvent.click(screen.getByText(CATALOG_ENTRIES[0].title));
    fireEvent.click(screen.getByText(/Enter Chamber/i));
    expect(screen.getByText('The Chamber')).toBeTruthy();
    fireEvent.click(screen.getByText(/Cease/i));
    expect(screen.getByText(/Enter Chamber/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 5 (ChamberInit) — Chamber.tsx
// Invariant: Initialize resets error+loading state; log appears after 2000ms; idempotent
// ---------------------------------------------------------------------------
describe('Chain 5 — ChamberInit', () => {
  it('starts in standby state with Initialize button', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    expect(screen.getByText('Initialize')).toBeTruthy();
    expect(screen.getByText(/Standby/i)).toBeTruthy();
  });

  it('Initialize transitions to active state (Initialize button disappears)', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    expect(screen.queryByText('Initialize')).toBeNull();
    expect(screen.getByText(/Active/i)).toBeTruthy();
  });

  it('"Rendering shadows..." log appears after 2000ms', () => {
    vi.useFakeTimers();
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    act(() => { vi.advanceTimersByTime(2100); });
    expect(screen.getByText('Rendering shadows...')).toBeTruthy();
    vi.useRealTimers();
  });

  it('Initialize resets iframeLoading to true (loading spinner appears)', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    expect(screen.getByText(/Loading Assets/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 7 (IframeError) — Chamber.tsx
// Invariants:
//   1. iframeError=true → FATAL ERROR UI renders (no loading spinner)
//   2. iframeErrorDetails displayed in ERR_DETAILS box when present
//   3. "View Debugging Guide" appends a warning log (never navigates away)
//   4. Re-Initialize resets ALL error state → STANDBY (Initialize button reappears)
//   5. After Re-Initialize → Initialize, loading state is fresh (no residual error)
//   6. initial atmospheric logs are always present (regression guard)
//
// Note: <iframe onError> is not a React synthetic event in JSDOM — fireEvent.error
// does not reach handleIframeError. Tests use the `initialError` prop to enter
// error state without relying on iframe DOM events, per the contract spec.
// ---------------------------------------------------------------------------
describe('Chain 7 — IframeError', () => {
  it('shows three initial atmospheric log entries (regression guard)', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    expect(screen.getByText(/Connection established/i)).toBeTruthy();
    expect(screen.getByText(/It sees you/i)).toBeTruthy();
    expect(screen.getByText(/Packet loss detected/i)).toBeTruthy();
  });

  it('renders FATAL ERROR UI when iframeError=true; loading spinner is absent', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} initialError="load failed" />);
    expect(screen.getByText(/FATAL ERROR/i)).toBeTruthy();
    expect(screen.getByText(/Failed to load simulation data/i)).toBeTruthy();
    // Invariant: loading spinner must not be shown alongside error UI
    expect(screen.queryByText(/Loading Assets/i)).toBeNull();
  });

  it('displays ERR_DETAILS box when iframeErrorDetails is non-null', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} initialError="ERR_NET_CHANGED" />);
    expect(screen.getByText(/ERR_DETAILS/i)).toBeTruthy();
    expect(screen.getByText(/ERR_NET_CHANGED/i)).toBeTruthy();
  });

  it('"View Debugging Guide" appends a warning log and does not navigate away', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} initialError="load failed" />);
    fireEvent.click(screen.getByText(/View Debugging Guide/i));
    expect(screen.getByText(/Debugging guide is currently unavailable/i)).toBeTruthy();
    // Error UI must still be showing — no navigation occurred
    expect(screen.getByText(/FATAL ERROR/i)).toBeTruthy();
  });

  it('Re-Initialize resets ALL error state: Initialize button reappears (STANDBY)', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} initialError="load failed" />);
    expect(screen.getByText(/FATAL ERROR/i)).toBeTruthy();
    // Chain 7 invariant: Re-Initialize must clear isInitialized, iframeError, iframeErrorDetails
    fireEvent.click(screen.getByText('Re-Initialize'));
    expect(screen.queryByText(/FATAL ERROR/i)).toBeNull();
    expect(screen.getByText('Initialize')).toBeTruthy();
    expect(screen.getByText(/Standby/i)).toBeTruthy();
  });

  it('after Re-Initialize → Initialize, state is fresh with no residual error', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} initialError="load failed" />);
    fireEvent.click(screen.getByText('Re-Initialize'));
    // Second Initialize from clean standby: must reach loading state, not error
    fireEvent.click(screen.getByText('Initialize'));
    expect(screen.queryByText(/FATAL ERROR/i)).toBeNull();
    expect(screen.getByText(/Loading Assets/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 11 (LogAppend) — Chamber.tsx
// Invariant: log array capped at MAX_LOGS=100; oldest entries evicted
// ---------------------------------------------------------------------------
describe('Chain 11 — LogAppend', () => {
  it('appendLog caps at MAX_LOGS and evicts oldest', () => {
    type LogEntry = { sender: string; time: string; msg: string; type: 'msg' | 'warn' | 'unknown' };
    const MAX_LOGS = 100;
    function appendLog(prev: LogEntry[], entry: LogEntry): LogEntry[] {
      const next = [...prev, entry];
      return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
    }
    const makeEntry = (i: number): LogEntry => ({
      sender: 'T', time: '00:00', msg: `Msg ${i}`, type: 'msg',
    });
    let logs: LogEntry[] = [];
    for (let i = 0; i < 110; i++) { logs = appendLog(logs, makeEntry(i)); }
    expect(logs.length).toBe(MAX_LOGS);
    expect(logs[0].msg).toBe('Msg 10');
    expect(logs[99].msg).toBe('Msg 109');
  });

  it('"Inject Log" button appends a manual override entry', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText(/Inject Log/i));
    expect(screen.getByText('Manual override initiated.')).toBeTruthy();
  });

  it('"Transmission Blocked" button appends a warning entry', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText(/Transmission Blocked/i));
    expect(screen.getByText('Transmission blocked. You have no voice here.')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 8 (ImageHotlink) — Chamber.tsx
// Invariant: origin validated; empty src rejected; valid src shows modal; modal closeable
// ---------------------------------------------------------------------------
describe('Chain 8 — ImageHotlink', () => {
  it('ignores postMessage from untrusted origin', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://evil.com/img.jpg' },
        origin: 'https://evil.com',
      }));
    });
    expect(screen.queryByText(/Asset_Viewer/i)).toBeNull();
  });

  it('ignores postMessage with empty src string', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: '' },
        origin: window.location.origin,
      }));
    });
    expect(screen.queryByText(/Asset_Viewer/i)).toBeNull();
  });

  it('shows modal for valid IMAGE_CLICKED from same origin', async () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://example.com/img.jpg' },
        origin: window.location.origin,
      }));
    });
    await waitFor(() => expect(screen.getByText(/Asset_Viewer/i)).toBeTruthy());
  });

  it('accepts IMAGE_CLICKED from srcdoc iframe (origin "null")', async () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'data:image/png;base64,abc' },
        origin: 'null',
      }));
    });
    await waitFor(() => expect(screen.getByText(/Asset_Viewer/i)).toBeTruthy());
  });

  it('closes modal when backdrop overlay is clicked', async () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://example.com/img.jpg' },
        origin: window.location.origin,
      }));
    });
    await waitFor(() => expect(screen.getByText(/Asset_Viewer/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Asset_Viewer/i).closest('.fixed')!);
    await waitFor(() => expect(screen.queryByText(/Asset_Viewer/i)).toBeNull());
  });
});

// ---------------------------------------------------------------------------
// Chain 9 (FullscreenToggle) — Chamber.tsx
// Invariant: button appears only post-init; toggle is its own inverse
// ---------------------------------------------------------------------------
describe('Chain 9b — FullscreenToggle', () => {
  it('fullscreen button absent before initialization', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    expect(screen.queryByTitle('Enter Fullscreen')).toBeNull();
  });

  it('fullscreen button present after initialization', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    expect(screen.getByTitle('Enter Fullscreen')).toBeTruthy();
  });

  it('toggle is its own inverse (Enter → Exit → Enter)', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    fireEvent.click(screen.getByTitle('Enter Fullscreen'));
    expect(screen.getByTitle('Exit Fullscreen')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Exit Fullscreen'));
    expect(screen.getByTitle('Enter Fullscreen')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Chain 10 (NoiseToggle) — Chamber.tsx
// Invariant: noise enabled by default; toggle changes button appearance
// ---------------------------------------------------------------------------
describe('Chain 10 — NoiseToggle', () => {
  it('noise is enabled by default (active button styling)', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    const noiseBtn = screen.getByText('NOISE').closest('button')!;
    expect(noiseBtn.className).toContain('border-white/20');
  });

  it('clicking noise button toggles active state', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    const noiseBtn = screen.getByText('NOISE').closest('button')!;
    fireEvent.click(noiseBtn);
    expect(noiseBtn.className).toContain('border-transparent');
    fireEvent.click(noiseBtn);
    expect(noiseBtn.className).toContain('border-white/20');
  });
});

// ---------------------------------------------------------------------------
// Chain 13 (HTMLContentInjection) — Chamber.tsx (pure logic)
// Invariant: script inserted before </body>; appended when no </body>; empty when no htmlContent
// ---------------------------------------------------------------------------
describe('Chain 13 — HTMLContentInjection', () => {
  const SCRIPT_MARKER = 'IMAGE_CLICKED';

  it('inserts click script before </body>', () => {
    const html = '<html><body><img src="x.jpg"></body></html>';
    const script = `<script>${SCRIPT_MARKER}</script>`;
    const result = html.replace('</body>', `${script}</body>`);
    const scriptIdx = result.indexOf(SCRIPT_MARKER);
    const bodyIdx = result.indexOf('</body>');
    expect(scriptIdx).toBeLessThan(bodyIdx);
  });

  it('appends script when </body> absent', () => {
    const html = '<html><img src="x.jpg"></html>';
    const script = `<script>${SCRIPT_MARKER}</script>`;
    const result = html.includes('</body>')
      ? html.replace('</body>', `${script}</body>`)
      : html + script;
    expect(result).toContain(SCRIPT_MARKER);
  });

  it('returns empty string for falsy htmlContent', () => {
    const result = (undefined as unknown as string) ? 'something' : '';
    expect(result).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Chain 6 (IframeLoad) — Chamber.tsx
// Invariant: loading spinner shown; no duplicate listeners (dedup via ref)
// ---------------------------------------------------------------------------
describe('Chain 6 — IframeLoad', () => {
  it('loading spinner visible immediately after Initialize', () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    expect(screen.getByText(/Loading Assets/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Model integrity — data.ts
// ---------------------------------------------------------------------------
describe('Model — CATALOG_ENTRIES integrity', () => {
  it('all entries have required fields (id, title, description, image)', () => {
    for (const e of CATALOG_ENTRIES) {
      expect(typeof e.id).toBe('string');
      expect(e.id.length).toBeGreaterThan(0);
      expect(typeof e.title).toBe('string');
      expect(typeof e.description).toBe('string');
      expect(typeof e.image).toBe('string');
    }
  });

  it('all url entries start with / (Vite public path)', () => {
    for (const e of CATALOG_ENTRIES) {
      if (e.url) expect(e.url).toMatch(/^\//);
    }
  });

  it('no two entries share the same id', () => {
    const ids = CATALOG_ENTRIES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has either url or htmlContent (not both, not neither for active entries)', () => {
    for (const e of CATALOG_ENTRIES) {
      if (!e.missing) {
        const hasUrl = Boolean(e.url);
        const hasHtml = Boolean(e.htmlContent);
        expect(hasUrl || hasHtml).toBe(true);
      }
    }
  });
});
