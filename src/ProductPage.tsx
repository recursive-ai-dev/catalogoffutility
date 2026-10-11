import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { isSafeCatalogUrl, type AppEntry } from "./data";
import { isCatalogDialogOpen, isEditingCatalogText } from "./lib/catalog";
import { resolvePublicAssetUrl } from "./lib/assets";

interface ProductPageProps {
  app: AppEntry;
  onBack: () => void;
  onEnter: () => void;
  onTagSelect: (tag: string) => void;
}

export const ProductPage = React.memo(function ProductPage({ app, onBack, onEnter, onTagSelect }: ProductPageProps) {
  return <ProductContent key={app.id} app={app} onBack={onBack} onEnter={onEnter} onTagSelect={onTagSelect} />;
});

function ProductContent({ app, onBack, onEnter, onTagSelect }: ProductPageProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const imageSource = resolvePublicAssetUrl(app.image);
  const [imageState, setImageState] = useState({ source: imageSource, failed: false });
  // Keep preview failure attached to its request, rather than the entry ID.
  if (imageState.source !== imageSource) setImageState({ source: imageSource, failed: false });
  const imageFailed = imageState.source === imageSource && imageState.failed;
  const desktopImageRef = useRef<HTMLImageElement>(null);
  const mobileImageRef = useRef<HTMLImageElement>(null);
  /** Announced through the aria-live status region next to the button. */
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const hasSource = app.url ? isSafeCatalogUrl(app.url) : Boolean(app.htmlContent?.trim());
  const isUnavailable = app.missing || !hasSource;

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image === desktopImageRef.current || image === mobileImageRef.current) setImageState({ source: imageSource, failed: true });
  };

  const handleCopyId = useCallback(async () => {
    if (copyInFlightRef.current) return;
    setCopied(false);
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    const resetStatus = () => {
      copyResetTimerRef.current = setTimeout(() => {
        setCopied(false);
        setCopyStatus(null);
        copyResetTimerRef.current = null;
      }, 2000);
    };

    // `navigator.clipboard` is undefined outside a secure context, so the old
    // early-return left the user with a button that did nothing at all.
    if (!navigator.clipboard?.writeText) {
      setCopyStatus("Copy unavailable in this context.");
      resetStatus();
      return;
    }

    try {
      copyInFlightRef.current = true;
      setCopying(true);
      setCopyStatus("Copying entry ID...");
      await navigator.clipboard.writeText(app.id);
      if (!mountedRef.current) return;
      setCopied(true);
      setCopyStatus(`Entry ID ${app.id} is on the clipboard.`);
      resetStatus();
    } catch {
      if (!mountedRef.current) return;
      setCopyStatus("Copy failed. The archive withheld the ID.");
      resetStatus();
    } finally {
      copyInFlightRef.current = false;
      if (mountedRef.current) setCopying(false);
    }
  }, [app.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const timer = setTimeout(() => setRevealed(true), reduceMotion?.matches ? 0 : 80);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape - consolidated redundant listeners (BUG-14)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const target = e.target instanceof Element ? e.target : document.activeElement;
      if (isCatalogDialogOpen(target) || isEditingCatalogText(target)) return;
      e.preventDefault();
      onBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  // Memoize paragraph splitting to avoid redundant string operations on every render.
  const paragraphs = useMemo(
    () => (app.longDescription ?? "").split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
    [app.longDescription],
  );

  return (
    <div className="relative flex h-dvh min-h-0 w-full bg-black font-sans text-white antialiased overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none atmosphere"></div>

      {/* Hero Image — left panel, desktop only */}
      <div
        className={`hidden lg:block w-[45%] shrink-0 relative overflow-hidden transition-opacity duration-700 motion-reduce:opacity-100 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        {!imageFailed && <img
          key={imageSource}
          ref={desktopImageRef}
          src={imageSource}
          alt=""
          aria-hidden="true"
          width={800}
          height={600}
          decoding="async"
          loading="lazy"
          onError={handleImageError}
          className="absolute inset-0 w-full h-full object-cover scale-110 opacity-25 mix-blend-luminosity"
          style={{ filter: "blur(3px)" }}
        />}
        {/* right-to-black fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/40 to-black pointer-events-none"></div>
        {/* top/bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none"></div>

        {/* Floating entry ID watermark */}
        <div className="absolute bottom-10 left-10 text-[9px] font-mono text-white/10 tracking-widest uppercase select-none">
          <p>ID: {app.id}</p>
          <p className="mt-1">ARCHIVE // {app.version ?? "—"}</p>
        </div>
      </div>

      {/* Right content panel */}
      <div
        className={`flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden z-10 border-l border-white/5 transition-all duration-700 motion-reduce:opacity-100 motion-reduce:translate-x-0 ${revealed ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
      >
        {/* Header */}
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-5 border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <button
            type="button"
            onClick={onBack}
            title="Back to catalog (Esc)"
            aria-keyshortcuts="Escape"
            className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none rounded-sm"
          >
            <span className="material-symbols-outlined !text-lg font-light transition-transform group-hover:-translate-x-1" aria-hidden="true">
              arrow_back
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase">
              Archive
            </span>
            <span className="text-[10px] text-white/20 font-mono select-none pointer-events-none" aria-hidden="true">
              [Esc]
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase min-w-0 break-all">
              Entry // <code className="text-white/40 select-all normal-case">{app.id}</code>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              disabled={copying}
              aria-busy={copying}
              className={`min-w-[100px] flex items-center justify-center gap-2 px-3 py-1.5 border rounded-full transition-all duration-300 text-[9px] font-mono tracking-widest uppercase cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none ${
                copied
                  ? "bg-white/10 border-white/40 text-white"
                  : "bg-transparent border-white/10 text-white/30 hover:border-white/30 hover:text-white/60"
              }`}
              aria-label={copying ? "Copying entry ID" : copied ? "ID copied" : "Copy entry ID"}
            >
              <span className="material-symbols-outlined !text-xs font-light" aria-hidden="true">
                {copied ? "check" : "content_copy"}
              </span>
              <span>{copying ? "Copying..." : copied ? "COPIED" : "Copy ID"}</span>
            </button>
            {/* Polite live region: the visual swap to "COPIED" is not announced
                otherwise, so a screen-reader user gets no confirmation. */}
            <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {copyStatus ?? ""}
            </p>
          </div>
        </header>

        {/* Scrollable body */}
        <main id="main-content" aria-labelledby="product-title" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto void-scroll outline-none">
          {/* Mobile hero thumbnail */}
          <div className="lg:hidden relative h-48 w-full overflow-hidden">
            {!imageFailed && <img
              key={imageSource}
              ref={mobileImageRef}
              src={imageSource}
              alt=""
              aria-hidden="true"
              width={800}
              height={600}
              decoding="async"
              fetchPriority="high"
              onError={handleImageError}
              className="w-full h-full object-cover opacity-30"
            />}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none"></div>
          </div>

          <div className="px-4 sm:px-8 lg:px-10 pt-8 sm:pt-12 pb-6">
            {/* Entry label */}
            <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-5">
              CATALOG_ENTRY :: {app.id}
            </p>

            {/* Version */}
            {app.version && (
              <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">
                {app.version}
              </p>
            )}

            {/* Title */}
            <h1 id="product-title" className="text-3xl sm:text-5xl break-words font-light text-white/90 tracking-widest uppercase font-display leading-tight mb-5">
              {app.title}
            </h1>
            <div className="h-px w-20 bg-white/20 mb-7"></div>

            {/* Tags */}
            {app.tags && app.tags.length > 0 && (
              <div role="group" aria-label="Entry categories" className="flex flex-wrap gap-2 mb-8">
                {app.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagSelect(tag)}
                    aria-label={`Filter by ${tag}`}
                    title={`Return to archive filtered by ${tag}`}
                    className="px-3 py-1 border border-white/10 text-white/35 hover:text-white/70 hover:border-white/30 transition-colors text-[9px] font-mono tracking-widest uppercase rounded-full cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Short description / tagline */}
            <p className="text-white/55 text-lg font-light leading-relaxed italic mb-10">
              {app.description}
            </p>

            {/* Long description */}
            {paragraphs.length > 0 && (
              <section aria-labelledby="entry-notes-title" className="mb-10">
                <h2 id="entry-notes-title" className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-5">
                  CLASSIFIED_NOTES //
                </h2>
                <div className="space-y-5">
                  {paragraphs.map((para, index) => (
                    <p
                      key={`${app.id}-${index}`}
                      className="text-white/45 text-sm font-light leading-7"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Technical manifest */}
            {(app.size || app.version || app.tech?.length || app.temp || app.users || app.queue || app.err) && <section aria-labelledby="entry-manifest-title" className="border border-white/8 rounded-2xl p-4 sm:p-6 bg-white/[0.02] mb-10">
              <h2 id="entry-manifest-title" className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-5">
                TECH_MANIFEST //
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {app.size && (
                  <div>
                    <dt className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-1">
                      File Size
                    </dt>
                    <dd className="text-white/55 font-mono text-sm break-words">
                      {app.size}
                    </dd>
                  </div>
                )}
                {app.version && (
                  <div>
                    <dt className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-1">
                      Version
                    </dt>
                    <dd className="text-white/55 font-mono text-sm break-words">
                      {app.version}
                    </dd>
                  </div>
                )}
                {([["Temperature", app.temp], ["Observers", app.users], ["Queue", app.queue], ["Error", app.err]] as const)
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => <div key={label}>
                    <dt className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-1">{label}</dt>
                    <dd className="text-white/55 font-mono text-sm break-words">{value}</dd>
                  </div>)}
                {app.tech && app.tech.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-3">
                      Stack
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {app.tech.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] font-mono text-white/40 px-2 py-1 border border-white/10 rounded-lg"
                        >
                          {t}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </section>}

            {/* Atmospheric warning */}
            <div className="flex items-start gap-3 mb-6 opacity-40">
              <span className="material-symbols-outlined text-sm font-light text-white/60 mt-px shrink-0" aria-hidden="true">
                warning
              </span>
              <p className="text-[9px] font-mono text-white/40 leading-relaxed tracking-wide">
                Psychological stability not guaranteed. Archive is not
                responsible for residual impressions, disturbed sleep, or
                altered perception of silence. Proceed with awareness.
              </p>
            </div>
          </div>
        </main>

        {/* Enter Chamber CTA */}
        <div className="shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => { if (!isUnavailable) onEnter(); }}
            disabled={isUnavailable}
            className="w-full group relative h-13 bg-white/[0.03] border border-white/20 hover:border-white/50 hover:bg-white/8 transition-all duration-500 flex items-center justify-center gap-4 cursor-pointer rounded-full overflow-hidden py-4 focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
          >
            <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors font-light" aria-hidden="true">
              play_circle
            </span>
            <span className="text-white/50 font-light tracking-[0.3em] text-[11px] uppercase group-hover:text-white transition-colors">
              {isUnavailable ? "Entry unavailable" : "Enter Chamber"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
