import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AppEntry } from "./data";
import { Clock, realClock } from "./lib/clock";

const MAX_LOGS = 100;

const HOTLINK_SCRIPT_TEMPLATE = `<script>
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      // Use '*' as target origin because sandboxed iframes without 'allow-same-origin'
      // have origin 'null', and window.location.origin would fail delivery.
      window.parent.postMessage({ type: 'IMAGE_CLICKED', src: e.target.src }, '*');
    }
  });
</script>`;

const SAFE_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|gif|webp|avif|bmp);base64,/i;

/**
 * Returns true only for URL schemes that are safe to render in an <img> src.
 * Blocks javascript:, vbscript:, blob:, and other non-media schemes.
 * Restricts data: URLs to safe raster formats (no SVG) to prevent potential XSS
 * and enforces a length limit to guard against client-side DoS (BUG-06b).
 */
function isSafeImageSrc(src: string): boolean {
  // Enforce a reasonable length limit (2MB) to prevent DoS via massive payloads.
  if (src.length > 2 * 1024 * 1024) return false;

  // Short-circuit common protocols to avoid expensive URL parsing overhead.
  if (src.startsWith("https://") || src.startsWith("http://")) return true;
  if (src.startsWith("data:")) return SAFE_DATA_URL_REGEX.test(src);

  try {
    const url = new URL(src);
    if (url.protocol === "https:") return true;
    // Allow http: only for local development (localhost or 127.0.0.1)
    if (url.protocol === "http:") {
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    }
    if (url.protocol === "data:") {
      // Allow only common raster image formats; explicitly block image/svg+xml
      // to mitigate potential XSS risks in certain rendering contexts.
      return /^data:image\/(png|jpeg|jpg|gif|webp|avif|bmp);base64,/i.test(src);
    }
    return false;
  } catch {
    // Parsing failed; reject.
  }
  return false;
}

function appendLog(
  prev: LogEntry[],
  entry: LogEntry,
): LogEntry[] {
  const next = [...prev, entry];
  return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
}

type LogEntry = {
  sender: string;
  time: string;
  msg: string;
  type: "msg" | "warn" | "unknown";
};

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

export function Chamber({ app, onBack, initialError, clock }: ChamberProps) {
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
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    // Use clk so test runs with a fake clock produce deterministic timestamps
    // and real timestamps are never mixed with decorative hard-coded strings.
    const t = clk.timeString();
    return [
      {
        sender: "SYSTEM_MSG",
        time: t,
        msg: "Connection established with the external node. Do not trust the visuals.",
        type: "msg",
      },
      {
        sender: "UNKNOWN_SENDER",
        time: t,
        msg: "It sees you. It has always seen you.",
        type: "unknown",
      },
      {
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
  clkRef.current = clk;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Chain 6 (IframeLoad): prevent duplicate listener injection across iframe load events
  const iframeDocRef = useRef<Document | null>(null);
  const iframeClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the hotlinked image modal opens
  useEffect(() => {
    if (hotlinkedImage) {
      modalCloseRef.current?.focus();
    }
  }, [hotlinkedImage]);

  // Close modal on Escape key
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setHotlinkedImage(null);
  }, []);

  // Cleanup injected iframe listener on Chamber unmount
  useEffect(() => {
    return () => {
      if (iframeDocRef.current && iframeClickHandlerRef.current) {
        try {
          iframeDocRef.current.removeEventListener(
            "click",
            iframeClickHandlerRef.current,
          );
        } catch {
          // cross-origin cleanup may throw; safe to ignore
        }
      }
    };
  }, []);

  // Chain 3 (ChamberInit): idempotent initialization — only react when transitioning to true
  useEffect(() => {
    if (isInitialized) {
      console.log(`[Chamber] Initializing ${app.title}...`);
      const timer = setTimeout(() => {
        setLogs((prev) =>
          appendLog(prev, {
            sender: "SYSTEM_MSG",
            time: clk.timeString(),
            msg: "Rendering shadows...",
            type: "msg",
          }),
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, app.title, clk]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Chain 8 (ImageHotlink): validate origin — only accept from same origin or null (srcdoc iframes)
      const isSameOrigin = e.origin === window.location.origin || e.origin === "null";
      if (!isSameOrigin) return;

      // Verify that the message is coming from our own iframe to prevent spoofing
      // from other windows or tabs (BUG-08b).
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;

      if (e.data && e.data.type === "IMAGE_CLICKED") {
        // Validate src: non-empty string with a safe image URL scheme (BUG-06)
        const src: unknown = e.data.src;
        if (typeof src !== "string" || src.trim() === "") return;
        if (!isSafeImageSrc(src)) return;

        setHotlinkedImage(src);
        setLogs((prev) =>
          appendLog(prev, {
            sender: "SYSTEM_MSG",
            // Use clkRef.current so this effect never closes over a stale clock
            // even if the clock prop changes after the initial mount.
            time: clkRef.current.timeString(),
            msg: `Intercepted image hotlink: ${src}`,
            type: "warn",
          }),
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.log(`[Chamber] ${app.title} iframe loaded successfully.`);
    setIframeLoading(false);

    if (app.url) {
      try {
        const iframe = e.target as HTMLIFrameElement;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Chain 6 (IframeLoad): remove any previously injected handler before re-injecting
          // to prevent duplicate listeners on iframe navigation / multi-load events.
          if (iframeDocRef.current && iframeClickHandlerRef.current) {
            iframeDocRef.current.removeEventListener(
              "click",
              iframeClickHandlerRef.current,
            );
          }

          const clickHandler = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "IMG") {
              event.preventDefault();
              // Use '*' as target origin because sandboxed iframes without 'allow-same-origin'
              // have origin 'null', and window.location.origin would fail delivery.
              window.parent.postMessage(
                {
                  type: "IMAGE_CLICKED",
                  src: (target as HTMLImageElement).src,
                },
                "*",
              );
            }
          };

          doc.addEventListener("click", clickHandler);
          iframeDocRef.current = doc;
          iframeClickHandlerRef.current = clickHandler;
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
    setIsFullscreen(!isFullscreen);
    console.log(`[Chamber] Fullscreen mode: ${!isFullscreen ? "ON" : "OFF"}`);
  };

  // Chain 13 (HTMLContentInjection): memoize so string is only built when app.htmlContent changes.
  // Template is hoisted to module scope to avoid repeated string creation.
  const htmlContentWithScript = useMemo(() => {
    if (!app.htmlContent) return "";
    return app.htmlContent.includes("</body>")
      ? app.htmlContent.replace("</body>", `${HOTLINK_SCRIPT_TEMPLATE}</body>`)
      : app.htmlContent + HOTLINK_SCRIPT_TEMPLATE;
  }, [app.htmlContent]);

  return (
    <div className="font-sans bg-black text-white antialiased overflow-hidden h-screen flex flex-col selection:bg-white/20 selection:text-white relative">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none atmosphere"></div>

      {/* Static Noise Overlay */}
      <div
        className={`fixed inset-0 z-10 pointer-events-none mix-blend-overlay bg-noise transition-opacity duration-1000 ${noiseEnabled ? "opacity-10" : "opacity-0"}`}
      ></div>

      {/* Top Navigation */}
      <header className="relative z-30 flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-black/40 backdrop-blur-xl px-10 py-6">
        <button
          className="flex items-center gap-6 text-white/70 hover:text-white cursor-pointer transition-colors group"
          onClick={onBack}
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
        </button>

        <div className="flex items-center gap-8">
          <button
            onClick={() => setNoiseEnabled(!noiseEnabled)}
            className={`hidden md:flex items-center gap-3 text-[10px] font-mono tracking-widest uppercase px-4 py-2 rounded-full border transition-all duration-300 ${noiseEnabled ? "border-white/20 text-white bg-white/5" : "border-transparent text-white/40 hover:text-white hover:bg-white/5"}`}
          >
            <span className="material-symbols-outlined text-sm font-light">
              {noiseEnabled ? "grain" : "lens_blur"}
            </span>
            <span>NOISE</span>
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
              <span className="material-symbols-outlined text-white/40 font-light text-sm">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative z-20">
        {/* Game Viewport Area */}
        <section className="flex-1 flex flex-col items-center justify-center relative p-6 md:p-10 lg:p-14">
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
                  onClick={toggleFullscreen}
                  className="absolute top-6 right-6 z-30 p-3 bg-black/40 hover:bg-white/10 text-white/50 hover:text-white rounded-full border border-white/10 hover:border-white/30 transition-all backdrop-blur-md cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  <span className="material-symbols-outlined text-sm font-light">
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
                      <span className="material-symbols-outlined text-6xl text-white/20 animate-pulse font-light">
                        visibility_off
                      </span>
                      <p className="text-white/40 font-mono text-xs tracking-widest uppercase leading-relaxed">
                        Input signal detected.
                        <br />
                        Ready to render {app.title}...
                      </p>
                      <button
                        onClick={() => {
                          // Chain 3 (ChamberInit): reset error/loading state before initializing
                          // so a re-enter after an error gets a clean slate
                          setIframeError(false);
                          setIframeErrorDetails(null);
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
                  <div className="text-center z-10 space-y-6 max-w-md p-8 border border-red-900/30 bg-red-950/10 rounded-2xl backdrop-blur-md">
                    <span className="material-symbols-outlined text-6xl text-red-500/40 font-light">
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
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setLogs((prev) =>
                          appendLog(prev, {
                            sender: "SYSTEM",
                            time: clk.timeString(),
                            msg: "Debugging guide is currently unavailable. Reality anchor is unstable.",
                            type: "warn",
                          }),
                        );
                      }}
                      className="inline-block mt-4 text-xs text-primary/70 hover:text-primary underline decoration-primary/30 underline-offset-4"
                    >
                      View Debugging Guide
                    </a>
                    {/* Chain 7 (IframeError): Re-Initialize resets to clean standby so the user
                        can retry without navigating away. Invariant: all three error-state fields
                        must be cleared atomically; isInitialized=false returns to STANDBY. */}
                    <button
                      onClick={() => {
                        setIsInitialized(false);
                        setIframeError(false);
                        setIframeErrorDetails(null);
                      }}
                      className="mt-2 px-8 py-3 bg-white/5 border border-white/10 text-white/70 hover:bg-white hover:text-black transition-all duration-300 uppercase text-[10px] font-light tracking-widest cursor-pointer rounded-full"
                    >
                      Re-Initialize
                    </button>
                  </div>
                ) : (
                  <>
                    {iframeLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                        <div className="flex flex-col items-center gap-4">
                          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
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
                      src={app.url}
                      srcDoc={app.url ? undefined : htmlContentWithScript}
                      className="w-full h-full border-none bg-black"
                      title={app.title}
                      sandbox={app.url ? "allow-scripts allow-forms" : "allow-scripts"}
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
        <aside className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col relative z-30 shrink-0">
          {/* Despair Level Section */}
          <div className="p-8 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-xs font-light tracking-widest uppercase flex items-center gap-3">
                <span className="material-symbols-outlined text-white/60 text-base font-light">
                  ecg_heart
                </span>
                Psych_Stblty
              </h3>
              <span className="text-[10px] text-white/50 font-mono animate-pulse tracking-widest">
                CRITICAL
              </span>
            </div>
            <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-white/40 w-[85%] relative">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-[9px] font-mono text-white/30 tracking-widest">
              <span>NORMAL</span>
              <span className="text-white/60">85% CORRUPTION</span>
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
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-white/40 hover:text-white transition-colors"
                  title={showLogs ? "Hide Logs" : "Show Logs"}
                >
                  <span className="material-symbols-outlined text-sm font-light">
                    {showLogs ? "visibility" : "visibility_off"}
                  </span>
                </button>
                <span className="block w-1.5 h-1.5 bg-white/60 rounded-full animate-ping"></span>
              </div>
            </div>
            {showLogs ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs void-scroll">
                {logs.map((log, i) => (
                  <div
                    key={i}
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
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center font-mono text-[10px] tracking-widest text-white/20">
                [LOGS_HIDDEN]
              </div>
            )}

            {/* Input Area (Disabled style) */}
            <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col gap-4">
              <button
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
                <span className="material-symbols-outlined text-sm font-light">lock</span>
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Transmission Blocked
                </span>
              </button>
              <button
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
                <span className="material-symbols-outlined text-sm font-light">
                  add_circle
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest">Inject Log</span>
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-8 border-t border-white/10 bg-white/5">
            <button
              onClick={onBack}
              className="group w-full relative h-12 bg-transparent border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all duration-300 overflow-hidden flex items-center justify-center gap-4 cursor-pointer rounded-full"
            >
              <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors font-light">
                power_settings_new
              </span>
              <span className="text-white/50 font-light tracking-[0.2em] text-[10px] uppercase group-hover:text-white transition-colors">
                Cease
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

      {/* Hotlinked Image Modal */}
      {hotlinkedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asset viewer"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-10"
          onClick={() => setHotlinkedImage(null)}
          onKeyDown={handleModalKeyDown}
        >
          <div
            className="relative max-w-5xl max-h-full border border-white/10 bg-black/60 p-4 shadow-2xl rounded-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10 mb-4">
              <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
                Asset_Viewer // Extracted
              </span>
              <button
                ref={modalCloseRef}
                onClick={() => setHotlinkedImage(null)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
                aria-label="Close image viewer"
              >
                <span className="material-symbols-outlined text-sm font-light" aria-hidden="true">close</span>
              </button>
            </div>
            <img
              src={hotlinkedImage}
              alt="Intercepted asset from the void"
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
