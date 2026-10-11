import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { AppEntry } from "./data";
import { Clock, realClock } from "./lib/clock";
import { ARCHIVE_CORRUPTION, MAX_LOGS } from "./lib/constants";
import { trapTabFocus } from "./lib/focus";

const IFRAME_LOAD_TIMEOUT_MS = 30_000;

function hotlinkScript(targetOrigin: string): string {
  return `<script>
  document.addEventListener('click', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
      e.preventDefault();
      window.parent.postMessage({ type: 'IMAGE_CLICKED', src: e.target.currentSrc || e.target.src }, ${JSON.stringify(targetOrigin)});
    }
  });
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !e.repeat && !e.defaultPrevented && !e.isComposing) {
      e.preventDefault();
      window.parent.postMessage({ type: 'CHAMBER_ESCAPE' }, ${JSON.stringify(targetOrigin)});
    }
  });
</script>`;
}

const SAFE_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|gif|webp|avif|bmp);base64,/i;

/** Static set of allowed keys for postMessage payload validation to avoid re-allocation. */
const IMAGE_CLICKED_ALLOWED_KEYS = new Set(['type', 'src']);

/**
 * Validates that a postMessage payload conforms to the expected JSON schema.
 * Returns true only for well-formed IMAGE_CLICKED messages with a string src.
 * Rejects payloads that are null, non-objects, missing required fields, or
 * have unexpected field types — providing a secondary validation layer beyond
 * origin checking (Chain 8 / PostMessage Validation TODO).
 */
function isValidImageClickedPayload(data: unknown): data is { type: 'IMAGE_CLICKED'; src: string } {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  const type = Object.getOwnPropertyDescriptor(d, "type");
  const src = Object.getOwnPropertyDescriptor(d, "src");
  if (!type || !src || !("value" in type) || !("value" in src)) return false;
  if (type.value !== 'IMAGE_CLICKED' || typeof src.value !== 'string') return false;
  // Reject payloads with unexpected extra fields that could indicate spoofing
  for (const key of Object.keys(d)) {
    if (!IMAGE_CLICKED_ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}

function isValidEscapePayload(data: unknown): boolean {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const type = Object.getOwnPropertyDescriptor(data, "type");
  return type?.value === "CHAMBER_ESCAPE" && Object.keys(data).length === 1;
}

/**
 * Returns true only for URL schemes that are safe to render in an <img> src.
 * Blocks javascript:, vbscript:, blob:, and other non-media schemes.
 * Restricts data: URLs to safe raster formats (no SVG) to prevent potential XSS.
 * Restricts http: to localhost/127.0.0.1 to prevent mixed-content warnings.
 * Enforces a 2MB length limit for data URLs and 8KB for remote URLs to guard against DoS.
 */
function isSafeImageSrc(src: string): boolean {
  const isData = /^data:/i.test(src);
  if (src.length > (isData ? 2 * 1024 * 1024 : 8192)) return false;
  if (src !== src.trim()) return false;
  for (let index = 0; index < src.length; index++) {
    const code = src.charCodeAt(index);
    if (code < 32 || code === 127) return false;
  }
  // Enforce a length limit (2MB) for data URLs.
  if (isData) {
    if (!SAFE_DATA_URL_REGEX.test(src)) return false;
    const data = src.slice(src.indexOf(",") + 1);
    return data.length > 0 && /^[a-z0-9+/]+={0,2}$/i.test(data);
  }

  try {
    const url = new URL(src);

    // Reject URLs with embedded credentials to prevent spoofing and SSRF-like
    // redirection patterns (e.g., https://user:pass@legit.com).
    if (url.username || url.password) return false;

    if (url.protocol === "https:") return true;
    // Allow http: only for local development (localhost or 127.0.0.1)
    if (url.protocol === "http:") {
      return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    }
    // Electron assets are limited to the installed application's own directory.
    if (url.protocol === "file:" && window.location.protocol === "file:") {
      const base = new URL(".", document.baseURI);
      const path = decodeURIComponent(url.pathname);
      const basePath = decodeURIComponent(base.pathname);
      return url.host === base.host && path.startsWith(basePath) &&
        !path.slice(basePath.length).split(/[\\/]/).includes("..");
    }
    // Note: `data:` is handled by the early return above and never reaches here.
    return false;
  } catch {
    // Parsing failed; reject.
  }
  return false;
}

/**
 * Efficiently appends a new log entry to the FIFO list.
 * Automatically assigns a stable, incrementing unique 'id' based on the previous
 * tail entry to ensure React can perform surgical DOM updates without full list
 * re-renders (BUG-11 / Optimization).
 */
function appendLog(
  prev: LogEntry[],
  entry: Omit<LogEntry, "id">,
): LogEntry[] {
  const lastId = prev.length > 0 ? prev[prev.length - 1].id : 0;
  const next = [...prev, { ...entry, id: lastId + 1 }];
  return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
}

type LogEntry = {
  id: number;
  sender: string;
  time: string;
  msg: string;
  type: "msg" | "warn" | "unknown";
};

/**
 * Memoized individual log entry to prevent redundant re-renders of the entire
 * log list when new entries are appended or old ones are evicted (BUG-11 / Optimization).
 * Since entries are immutable once created, memoization here ensures O(1)
 * reconciliation per new entry.
 */
const LogEntryItem = React.memo(function LogEntryItem({
  log,
}: {
  log: LogEntry;
}) {
  return (
    <div
      className={`flex flex-col gap-2 ${log.type === "msg" ? "opacity-60 hover:opacity-100" : log.type === "warn" ? "opacity-80" : ""} transition-opacity`}
    >
      <span
        className={`${log.type === "unknown" ? "text-white/70" : "text-white/30"} text-[9px] tracking-widest`}
      >
        [{log.sender}] {log.time}
      </span>
      <p
        className={`${log.type === "unknown" ? "text-white/90" : "text-white/50"} font-light leading-relaxed`}
      >
        {log.msg}
      </p>
    </div>
  );
});

interface ChamberProps {
  app: AppEntry;
  onBack: () => void;
  /**
   * Starts the Chamber pre-initialized in error state.
   * Used in integration tests to reach the iframeError branch without
   * relying on iframe DOM events (which JSDOM does not fire for <iframe>).
   * Never set in production code.
   */
  initialError?: string | null;
  /**
   * Determinism provider. Pass `makeFakeClock(fixed)` in tests to freeze
   * all log timestamps at a known instant, enabling seed-controlled replay.
   * Defaults to the live wall-clock in production.
   */
  clock?: Clock;
}

export const Chamber = React.memo(function Chamber(props: ChamberProps) {
  const { app } = props;
  // A new artifact or source starts a fresh session, including timers and listeners.
  const sessionKey = JSON.stringify([app.id, app.url, app.htmlContent, app.sandbox]);
  return <ChamberSession key={sessionKey} {...props} />;
});

function ChamberSession({ app, onBack, initialError, clock }: ChamberProps) {
  const clk = clock ?? realClock;
  // Chain 7 (IframeError): initialError allows tests to start in error state
  const [isInitialized, setIsInitialized] = useState(initialError != null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(initialError != null);
  const [iframeErrorDetails, setIframeErrorDetails] = useState<string | null>(
    initialError ?? null,
  );
  const [showLogs, setShowLogs] = useState(true);
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [hotlinkedImage, setHotlinkedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const modalOpen = hotlinkedImage !== null;
  const iframeUrl = useMemo(() => {
    if (!app.url) return undefined;
    if (window.location.protocol === "file:" && app.url.startsWith("/")) {
      return new URL(app.url.slice(1), document.baseURI).href;
    }
    return app.url;
  }, [app.url]);
  const sourceError = useMemo(() => {
    if (!iframeUrl) return app.htmlContent?.trim() ? null : "This artifact has no simulation source.";
    try {
      const url = new URL(iframeUrl, document.baseURI);
      const allowed = ["https:", "http:"];
      if (window.location.protocol === "file:") allowed.push("file:");
      if (!allowed.includes(url.protocol) || url.username || url.password) {
        return "The simulation source URL is unsupported.";
      }
      return null;
    } catch {
      return "The simulation source URL is invalid.";
    }
  }, [iframeUrl, app.htmlContent]);
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    // Use clk so test runs with a fake clock produce deterministic timestamps
    // and real timestamps are never mixed with decorative hard-coded strings.
    const t = clk.timeString();
    return [
      {
        id: 1,
        sender: "SYSTEM_MSG",
        time: t,
        msg: "Connection established with the external node. Do not trust the visuals.",
        type: "msg",
      },
      {
        id: 2,
        sender: "UNKNOWN_SENDER",
        time: t,
        msg: "It sees you. It has always seen you.",
        type: "unknown",
      },
      {
        id: 3,
        sender: "SYSTEM_WARN",
        time: t,
        msg: "Packet loss detected. Reality buffer is thinning.",
        type: "warn",
      },
    ];
  });

  // Keep the latest clock in a ref so the long-lived handleMessage effect always
  // reads the current clock without needing to re-register the listener when
  // the clock prop changes (never happens in production; may occur in tests).
  const clkRef = useRef(clk);
  useLayoutEffect(() => { clkRef.current = clk; }, [clk]);
  const onBackRef = useRef(onBack);
  useLayoutEffect(() => { onBackRef.current = onBack; }, [onBack]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (!showLogs || !logsEndRef.current) return;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    logsEndRef.current?.scrollIntoView?.({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [logs, showLogs]);

  // Chain 6 (IframeLoad): prevent duplicate listener injection across iframe load events
  const iframeDocRef = useRef<Document | null>(null);
  const iframeClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const iframeKeyTargetRef = useRef<Window | null>(null);
  const iframeKeyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const fullscreenToggleRef = useRef<HTMLButtonElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current !== null) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const detachIframeClickHandler = useCallback(() => {
    try {
      if (iframeDocRef.current && iframeClickHandlerRef.current) {
        iframeDocRef.current.removeEventListener("click", iframeClickHandlerRef.current);
      }
      if (iframeKeyTargetRef.current && iframeKeyHandlerRef.current) {
        iframeKeyTargetRef.current.removeEventListener("keydown", iframeKeyHandlerRef.current);
      }
    } catch {
      // A frame may have navigated to a different origin before cleanup.
    }
    iframeDocRef.current = null;
    iframeClickHandlerRef.current = null;
    iframeKeyTargetRef.current = null;
    iframeKeyHandlerRef.current = null;
  }, []);

  /** Element that held focus before the asset viewer opened; restored on close. */
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Focus the close button when the hotlinked image modal opens, and remember
  // where focus came from so it can be handed back on close.
  useEffect(() => {
    if (modalOpen) {
      modalCloseRef.current?.focus({ preventScroll: true });
      return () => {
        const restore = lastFocusedRef.current;
        lastFocusedRef.current = null;
        if (restore?.isConnected) restore.focus({ preventScroll: true });
      };
    }
    return undefined;
  }, [modalOpen]);

  /**
   * WCAG 2.1 SC 2.1.2 — constrain Tab to the modal while `aria-modal="true"`.
   * Without this, keyboard users tabbed straight through the overlay into the
   * Chamber controls behind it.
   */
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    trapTabFocus(e, modalPanelRef.current, document.activeElement);
  }, []);

  // Keep hotlinkedImage in a ref for the global keydown listener to avoid
  // re-registering the listener on every hotlink event (BUG-13).
  const hotlinkedImageRef = useRef(hotlinkedImage);
  useLayoutEffect(() => { hotlinkedImageRef.current = hotlinkedImage; }, [hotlinkedImage]);

  // Same treatment for fullscreen state — see the layered Escape handler below.
  const isFullscreenRef = useRef(isFullscreen);
  useLayoutEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);

  // Global Escape listener. Dismissal is layered, innermost overlay first:
  //   1. hotlinked-image modal  2. fullscreen viewport  3. the view itself
  // Fullscreen was previously skipped, so Escape from a fullscreen session threw
  // the user out of the Chamber instead of returning them to the framed view.
  const dismissCurrentLayer = useCallback(() => {
    if (hotlinkedImageRef.current) {
      setHotlinkedImage(null);
      return;
    }
    if (isFullscreenRef.current) {
      setIsFullscreen(false);
      fullscreenToggleRef.current?.focus({ preventScroll: true });
      return;
    }
    onBackRef.current();
  }, []);

  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.repeat || e.defaultPrevented || e.isComposing) return;
    e.preventDefault();
    e.stopPropagation();
    dismissCurrentLayer();
  }, [dismissCurrentLayer]);

  useEffect(() => {
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [handleEscapeKey]);

  // Release listeners as soon as a failed/retried frame is removed.
  useEffect(() => {
    if (!isInitialized || iframeError) detachIframeClickHandler();
    return detachIframeClickHandler;
  }, [isInitialized, iframeError, detachIframeClickHandler]);

  useEffect(() => {
    if (!isInitialized || iframeError || !iframeLoading) return undefined;
    loadTimerRef.current = setTimeout(() => {
      loadTimerRef.current = null;
      setIframeLoading(false);
      setIframeError(true);
      setIframeErrorDetails("The simulation did not finish loading within 30 seconds. Retry to reconnect.");
    }, IFRAME_LOAD_TIMEOUT_MS);
    return clearLoadTimer;
  }, [isInitialized, iframeError, iframeLoading, clearLoadTimer]);

  // Chain 3 (ChamberInit): idempotent initialization — only react when transitioning to true
  useEffect(() => {
    if (isInitialized) {
      console.log(`[Chamber] Initializing ${app.title}...`);
      const timer = setTimeout(() => {
        setLogs((prev) =>
          appendLog(prev, {
            sender: "SYSTEM_MSG",
            time: clkRef.current.timeString(),
            msg: "Rendering shadows...",
            type: "msg",
          }),
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInitialized, app.title]);

  const interceptImage = useCallback((src: string) => {
    if (!isSafeImageSrc(src) || hotlinkedImageRef.current) return;
    const active = document.activeElement;
    // Capture before rendering inert background content, which may blur it.
    lastFocusedRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    hotlinkedImageRef.current = src;
    setImageError(false);
    setHotlinkedImage(src);
    setLogs((prev) => appendLog(prev, {
      sender: "SYSTEM_MSG",
      time: clkRef.current.timeString(),
      msg: `Intercepted image hotlink: ${src.length > 100 ? src.substring(0, 97) + "..." : src}`,
      type: "warn",
    }));
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Verify the sender before parsing the configured source or its payload.
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      const sourceOrigin = new URL(iframeUrl ?? document.baseURI, document.baseURI).origin;
      const isExpectedOrigin = e.origin === sourceOrigin || e.origin === window.location.origin || e.origin === "null";
      if (!isExpectedOrigin) return;

      if (isValidEscapePayload(e.data)) {
        dismissCurrentLayer();
        return;
      }

      // Chain 8 (ImageHotlink): secondary schema validation — reject malformed payloads
      // before any field access, providing defense-in-depth beyond origin checking.
      if (!isValidImageClickedPayload(e.data)) return;

      // Validate src: non-empty string with a safe image URL scheme (BUG-06)
      interceptImage(e.data.src);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeUrl, interceptImage, dismissCurrentLayer]);

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (e.currentTarget !== iframeRef.current) return;
    console.log(`[Chamber] ${app.title} iframe loaded successfully.`);
    clearLoadTimer();
    setIframeLoading(false);

    if (app.url) {
      try {
        const iframe = e.currentTarget;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Chain 6 (IframeLoad): remove any previously injected handler before re-injecting
          // to prevent duplicate listeners on iframe navigation / multi-load events.
          detachIframeClickHandler();

          const clickHandler = (event: MouseEvent) => {
            const target = event.target as HTMLImageElement | null;
            if (target?.tagName === "IMG") {
              event.preventDefault();
              // This handler runs in the parent realm, so use the validated receiver
              // directly rather than pretending the parent is the iframe sender.
              interceptImage(target.currentSrc || target.src);
            }
          };

          doc.addEventListener("click", clickHandler);
          iframeDocRef.current = doc;
          iframeClickHandlerRef.current = clickHandler;
          doc.defaultView?.addEventListener("keydown", handleEscapeKey);
          iframeKeyTargetRef.current = doc.defaultView;
          iframeKeyHandlerRef.current = handleEscapeKey;
        }
      } catch (err) {
        console.warn(
          "[Chamber] Could not inject hotlink script into iframe (likely cross-origin).",
          err,
        );
      }
    }
  };

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (e.currentTarget !== iframeRef.current) return;
    clearLoadTimer();
    // Browsers do not expose the actual load-failure reason for iframes via the
    // onError event. Log a correlation ID so the console entry can be matched
    // to the in-app error display without relying on unextractable browser details.
    const correlationId = `${app.id}@${clk.timeString()}`;
    console.error(`[Chamber:${correlationId}] iframe load failed.`, e.nativeEvent);
    setIframeLoading(false);
    setIframeError(true);
    setIframeErrorDetails(`REF:${correlationId}`);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((value) => !value);
  };

  // Chain 13 (HTMLContentInjection): memoize so string is only built when app.htmlContent changes.
  // Template is hoisted to module scope to avoid repeated string creation.
  const htmlContentWithScript = useMemo(() => {
    if (!app.htmlContent) return "";
    const script = hotlinkScript(window.location.origin === "null" ? "*" : window.location.origin);
    return /<\/body\s*>/i.test(app.htmlContent)
      ? app.htmlContent.replace(/<\/body\s*>/i, (closingBody) => `${script}${closingBody}`)
      : app.htmlContent + script;
  }, [app.htmlContent]);

  const corruption = ARCHIVE_CORRUPTION;

  return (
    <div className="font-sans bg-black text-white antialiased overflow-hidden h-dvh min-h-0 flex flex-col selection:bg-white/20 selection:text-white relative">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none atmosphere"></div>

      {/* Static Noise Overlay */}
      <div
        className={`fixed inset-0 z-10 pointer-events-none mix-blend-overlay bg-noise transition-opacity duration-1000 ${noiseEnabled ? "opacity-10" : "opacity-0"}`}
      ></div>

      <div className="contents" inert={modalOpen} aria-hidden={modalOpen ? true : undefined}>
      {/* Top Navigation */}
      <header className="relative z-30 flex flex-wrap gap-4 items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 sm:px-10 py-4 sm:py-6">
        <button
          type="button"
          className="flex items-center gap-6 text-white/70 hover:text-white cursor-pointer transition-colors group focus-visible:ring-1 focus-visible:ring-white/40 outline-none rounded-sm"
          onClick={onBack}
          title="Back to product (Esc)"
          aria-label="Back to product page"
        >
          <div className="size-6 transition-transform group-hover:-translate-x-1">
            <span className="material-symbols-outlined !text-2xl font-light" aria-hidden="true">
              arrow_back
            </span>
          </div>
          <h2 className="text-white/90 text-2xl font-light tracking-widest uppercase font-display">
            The Chamber
          </h2>
          <span className="text-[10px] text-white/20 font-mono select-none pointer-events-none" aria-hidden="true">
            [Esc]
          </span>
        </button>

        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setNoiseEnabled((value) => !value)}
            aria-pressed={noiseEnabled}
            aria-label="Toggle static noise overlay"
            className={`flex items-center gap-3 text-[10px] font-mono tracking-widest uppercase px-4 py-2 rounded-full border transition-all duration-300 focus-visible:ring-1 focus-visible:ring-white/40 outline-none ${noiseEnabled ? "border-white/20 text-white bg-white/5" : "border-transparent text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">
              {noiseEnabled ? "grain" : "lens_blur"}
            </span>
            <span className="hidden sm:inline">NOISE</span>
          </button>
          <div className="hidden md:flex items-center gap-3 text-[10px] font-mono tracking-widest uppercase text-white/40">
            <span className="inline-block size-1.5 rounded-full bg-white/60 animate-pulse"></span>
            <span>SYSTEM_STABLE</span>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest hidden sm:block">
              Subject 892
            </span>
            <div
              className="rounded border border-[#233f48] size-8 opacity-70 flex items-center justify-center bg-white/5"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-white/40 font-light text-sm" aria-hidden="true">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 flex flex-col md:flex-row overflow-auto md:overflow-hidden relative z-20 outline-none">
        {/* Game Viewport Area */}
        <section
          aria-label="Simulation viewport"
          className="flex-1 min-h-[50dvh] md:min-h-0 flex flex-col items-center justify-center relative p-4 md:p-10 lg:p-14"
        >
          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

          <div
            className={`w-full h-full max-w-5xl max-h-[80vh] flex flex-col ${isFullscreen ? "fixed inset-0 z-50 max-w-none max-h-none bg-black p-0" : ""}`}
          >
            {!isFullscreen && (
              <div className="flex justify-between items-end pb-4 px-2">
                <h1 className="text-white/60 tracking-widest text-xs font-light uppercase font-mono">
                  Viewport_01 // {isInitialized ? "Active" : "Standby"}
                </h1>
                <span className="text-[10px] text-white/30 font-mono">
                  FR: 59.94
                </span>
              </div>
            )}

            {/* The Actual Game Frame */}
            <div
              className={`relative flex-1 ${isFullscreen ? "border-none rounded-none" : "border border-white/10 shadow-2xl rounded-xl"} bg-black overflow-hidden group`}
            >
              {/* Inner Bezel Glow */}
              {!isFullscreen && (
                <div className="absolute inset-0 border border-white/5 pointer-events-none z-10 box-border rounded-xl"></div>
              )}

              {/* Fullscreen Toggle Button */}
              {isInitialized && (
                <button
                  type="button"
                  ref={fullscreenToggleRef}
                  onClick={toggleFullscreen}
                  className="absolute top-6 right-6 z-30 p-3 bg-black/40 hover:bg-white/10 text-white/50 hover:text-white rounded-full border border-white/10 hover:border-white/30 transition-all backdrop-blur-md cursor-pointer focus-visible:ring-1 focus-visible:ring-white/40 outline-none"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  aria-pressed={isFullscreen}
                >
                  <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">
                    {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                  </span>
                </button>
              )}

              {/* Game Canvas Placeholder / Iframe */}
              <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
                {!isInitialized ? (
                  <>
                    <div className="absolute inset-0 opacity-20 mix-blend-luminosity" style={{background: "radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #0a0a0f 60%, #000 100%)"}}></div>
                    <div className="text-center z-10 space-y-6">
                      <span className="material-symbols-outlined text-6xl text-white/20 animate-pulse font-light" aria-hidden="true">
                        visibility_off
                      </span>
                      <p className="text-white/40 font-mono text-xs tracking-widest uppercase leading-relaxed">
                        Input signal detected.
                        <br />
                        Ready to render {app.title}...
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          // Chain 3 (ChamberInit): reset error/loading state before initializing
                          // so a re-enter after an error gets a clean slate
                          setIframeError(sourceError !== null);
                          setIframeErrorDetails(sourceError);
                          setIframeLoading(true);
                          setIsInitialized(true);
                        }}
                        className="mt-10 px-8 py-3 bg-white/5 border border-white/10 text-white/70 hover:bg-white hover:text-black transition-all duration-300 uppercase text-[10px] font-light tracking-widest cursor-pointer rounded-full"
                      >
                        Initialize
                      </button>
                    </div>
                  </>
                ) : iframeError ? (
                  <div role="alert" className="text-center z-10 space-y-6 max-w-md p-8 border border-red-900/30 bg-red-950/10 rounded-2xl backdrop-blur-md">
                    <span className="material-symbols-outlined text-6xl text-red-500/40 font-light" aria-hidden="true">
                      error_outline
                    </span>
                    <p className="text-red-400/60 font-mono text-xs tracking-widest uppercase mb-4 leading-relaxed">
                      FATAL ERROR
                      <br />
                      Failed to load simulation data.
                    </p>
                    {iframeErrorDetails && (
                      <div className="text-[10px] font-mono text-red-300/50 bg-black/40 p-4 rounded-xl text-left overflow-auto border border-red-900/20">
                        <span className="text-red-500/60">ERR_DETAILS:</span>{" "}
                        {iframeErrorDetails}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setLogs((prev) =>
                          appendLog(prev, {
                            sender: "SYSTEM",
                            time: clk.timeString(),
                            msg: "Debugging guide is currently unavailable. Reality anchor is unstable.",
                            type: "warn",
                          }),
                        );
                      }}
                      className="inline-block mt-4 text-xs text-primary/70 hover:text-primary underline decoration-primary/30 underline-offset-4 cursor-pointer focus-visible:ring-1 focus-visible:ring-white/40 outline-none rounded-sm"
                    >
                      View Debugging Guide
                    </button>
                    {/* Chain 7 (IframeError): Re-Initialize resets to clean standby so the user
                        can retry without navigating away. Invariant: all three error-state fields
                        must be cleared atomically; isInitialized=false returns to STANDBY. */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsInitialized(false);
                        setIframeError(false);
                        setIframeErrorDetails(null);
                        setIframeLoading(true);
                        setIsFullscreen(false);
                      }}
                      className="mt-2 px-8 py-3 bg-white/5 border border-white/10 text-white/70 hover:bg-white hover:text-black transition-all duration-300 uppercase text-[10px] font-light tracking-widest cursor-pointer rounded-full"
                    >
                      Re-Initialize
                    </button>
                  </div>
                ) : (
                  <>
                    {iframeLoading && (
                      <div role="status" aria-live="polite" className="absolute inset-0 flex items-center justify-center bg-black z-20">
                        <div className="flex flex-col items-center gap-4">
                          <span className="material-symbols-outlined text-4xl text-primary animate-spin" aria-hidden="true">
                            sync
                          </span>
                          <span className="text-primary/70 font-mono text-xs tracking-widest uppercase animate-pulse">
                            Loading Assets...
                          </span>
                        </div>
                      </div>
                    )}
                      <iframe
                        ref={iframeRef}
                        src={iframeUrl}
                        srcDoc={app.url ? undefined : htmlContentWithScript}
                        className="w-full h-full border-none bg-black"
                        title={app.title}
                        aria-busy={iframeLoading}
                        tabIndex={iframeLoading ? -1 : 0}
                        referrerPolicy="no-referrer"
                        // Catalog URLs are curated application code and need storage APIs.
                        // Inline HTML remains opaque: scripts plus same-origin would let it
                        // access the parent and remove its sandbox.
                        sandbox={app.sandbox ?? (app.url ? "allow-scripts allow-forms allow-same-origin" : "allow-scripts")}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                  </>
                )}
              </div>
            </div>

            {!isFullscreen && (
              <div className="flex justify-between items-start pt-4 px-2 text-[10px] text-white/30 font-mono uppercase tracking-widest">
                <span>Mem_Alloc: 4096MB</span>
                <span>Sec_Lvl: Omega</span>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar / Control Panel */}
        <aside className="w-full md:w-80 md:min-h-0 border-t md:border-t-0 md:border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col relative z-30 shrink-0">
          {/* Despair Level Section */}
          <div className="p-8 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-xs font-light tracking-widest uppercase flex items-center gap-3">
                <span className="material-symbols-outlined text-white/60 text-base font-light" aria-hidden="true">
                  ecg_heart
                </span>
                Psych_Stblty
              </h3>
              <span className="text-[10px] text-white/50 font-mono animate-pulse tracking-widest">
                CRITICAL
              </span>
            </div>            
            <div
              className="relative h-1 bg-white/5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={corruption}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Psychological stability"
              aria-valuetext={`${corruption}% corruption, critical`}
            >
              <div className="h-full bg-white/40 relative" style={{ width: `${corruption}%` }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-[9px] font-mono text-white/30 tracking-widest">
              <span>NORMAL</span>
              {/* Interpolated, not hard-coded: the literal used to say "85%"
                  regardless of the value actually driving the bar above. */}
              <span className="text-white/60">{corruption}% CORRUPTION</span>
            </div>
          </div>

          {/* Void Chat Section */}
          <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <span className="text-[10px] font-light text-white/60 uppercase tracking-widest">
                Void_Log // v.0.4
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowLogs((value) => !value)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none rounded-sm"
                  title={showLogs ? "Hide Logs" : "Show Logs"}
                  aria-label={showLogs ? "Hide logs" : "Show logs"}
                  aria-pressed={showLogs}
                  aria-expanded={showLogs}
                  aria-controls="chamber-void-log"
                >
                  <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">
                    {showLogs ? "visibility" : "visibility_off"}
                  </span>
                </button>
                <span className="block w-1.5 h-1.5 bg-white/60 rounded-full animate-ping"></span>
              </div>
            </div>
            {showLogs ? (
              <div
                role="log"
                id="chamber-void-log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Void log"
                className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs void-scroll"
              >
                {logs.map((log) => (
                  <LogEntryItem key={log.id} log={log} />
                ))}
                <div ref={logsEndRef} />
              </div>
            ) : (
              <div id="chamber-void-log" className="flex-1 flex items-center justify-center font-mono text-[10px] tracking-widest text-white/20">
                [LOGS_HIDDEN]
              </div>
            )}

            {/* Input Area (Disabled style) */}
            <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col gap-4">
              <button
                type="button"
                onClick={() =>
                  setLogs((prev) =>
                    appendLog(prev, {
                      sender: "SYSTEM",
                      time: clk.timeString(),
                      msg: "Transmission blocked. You have no voice here.",
                      type: "warn",
                    }),
                  )
                }
                className="w-full flex items-center gap-3 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">lock</span>
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Transmission Blocked
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setLogs((prev) =>
                    appendLog(prev, {
                      sender: "MANUAL_OVR",
                      time: clk.timeString(),
                      msg: "Manual override initiated.",
                      type: "msg",
                    }),
                  )
                }
                className="w-full flex items-center gap-3 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">
                  add_circle
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest">Inject Log</span>
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-8 border-t border-white/10 bg-white/5">
            <button
              type="button"
              onClick={onBack}
              title="Cease (Esc)"
              className="group w-full relative h-12 bg-transparent border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all duration-300 overflow-hidden flex items-center justify-center gap-4 cursor-pointer rounded-full"
            >
              <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors font-light" aria-hidden="true">
                power_settings_new
              </span>
              <span className="text-white/50 font-light tracking-[0.2em] text-[10px] uppercase group-hover:text-white transition-colors">
                Cease
              </span>
              <span className="text-[10px] text-white/20 font-mono select-none pointer-events-none" aria-hidden="true">
                [Esc]
              </span>
            </button>
            <div className="mt-6 text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono">
                Session ID: <span className="text-white/50">NULL_PTR_EX</span>
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Global Decoration: Floating data points */}
      <div className="fixed bottom-6 left-10 z-50 pointer-events-none hidden lg:block">
        <div className="flex flex-col gap-2 text-[9px] font-mono text-white/20 tracking-widest">
          <span>COORDS: 45.912, -12.001</span>
          <span>TEMP: 14°C [DROPPING]</span>
          <span>NOISE_LVL: -4dB</span>
        </div>
      </div>
      </div>

      {/* Hotlinked Image Modal */}
      {hotlinkedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asset viewer"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-10"
          onClick={() => setHotlinkedImage(null)}
          onKeyDown={handleModalKeyDown}
        >
          <div
            ref={modalPanelRef}
            className="relative max-w-5xl max-h-full border border-white/10 bg-black/60 p-4 shadow-2xl rounded-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10 mb-4">
              <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
                Asset_Viewer // Extracted
              </span>
              <button
                ref={modalCloseRef}
                type="button"
                onClick={() => setHotlinkedImage(null)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
                aria-label="Close image viewer"
              >
                <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">close</span>
              </button>
            </div>
            <img
              key={hotlinkedImage}
              src={hotlinkedImage}
              referrerPolicy="no-referrer"
              decoding="async"
              onError={() => setImageError(true)}
              alt="Intercepted asset from the void"
              className={`max-w-full max-h-[75vh] object-contain rounded-lg ${imageError ? "hidden" : ""}`}
            />
            {imageError && <p role="status" className="p-4 text-white/70">This image could not be loaded.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
