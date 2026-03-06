import React, { useState, useEffect, useMemo } from "react";
import { AppEntry } from "./data";

interface ProductPageProps {
  app: AppEntry;
  onBack: () => void;
  onEnter: () => void;
}

export function ProductPage({ app, onBack, onEnter }: ProductPageProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  // Memoize paragraph splitting to avoid redundant string operations on every render.
  const paragraphs = useMemo(
    () => (app.longDescription ? app.longDescription.split("\n\n").filter(Boolean) : []),
    [app.longDescription],
  );

  return (
    <div className="relative flex h-screen w-full bg-black font-sans text-white antialiased overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none atmosphere"></div>

      {/* Hero Image — left panel, desktop only */}
      <div
        className={`hidden lg:block w-[45%] shrink-0 relative overflow-hidden transition-opacity duration-700 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <img
          src={app.image}
          alt={app.title}
          className="absolute inset-0 w-full h-full object-cover scale-110 opacity-25 mix-blend-luminosity"
          style={{ filter: "blur(3px)" }}
        />
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
        className={`flex-1 flex flex-col h-full overflow-hidden z-10 border-l border-white/5 transition-all duration-700 ${revealed ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
      >
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <button
            onClick={onBack}
            title="Back to catalog (Esc)"
            className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined !text-lg font-light transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase">
              Archive
            </span>
          </button>

          <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase">
            Entry //{" "}
            <span className="text-white/40">{app.id.toUpperCase()}</span>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto void-scroll">
          {/* Mobile hero thumbnail */}
          <div className="lg:hidden relative h-48 w-full overflow-hidden">
            <img
              src={app.image}
              alt={app.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none"></div>
          </div>

          <div className="px-10 pt-12 pb-6">
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
            <h1 className="text-4xl sm:text-5xl font-light text-white/90 tracking-widest uppercase font-display leading-tight mb-5">
              {app.title}
            </h1>
            <div className="h-px w-20 bg-white/20 mb-7"></div>

            {/* Tags */}
            {app.tags && app.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {app.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 border border-white/10 text-white/35 text-[9px] font-mono tracking-widest uppercase rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Short description / tagline */}
            <p className="text-white/55 text-lg font-light leading-relaxed italic mb-10">
              {app.description}
            </p>

            {/* Long description */}
            {paragraphs.length > 0 && (
              <div className="mb-10">
                <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-5">
                  CLASSIFIED_NOTES //
                </p>
                <div className="space-y-5">
                  {paragraphs.map((para, i) => (
                    <p
                      key={i}
                      className="text-white/45 text-sm font-light leading-7"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Technical manifest */}
            <div className="border border-white/8 rounded-2xl p-6 bg-white/[0.02] mb-10">
              <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-5">
                TECH_MANIFEST //
              </p>
              <div className="grid grid-cols-2 gap-5">
                {app.size && (
                  <div>
                    <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-1">
                      File Size
                    </span>
                    <span className="text-white/55 font-mono text-sm">
                      {app.size}
                    </span>
                  </div>
                )}
                {app.version && (
                  <div>
                    <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-1">
                      Version
                    </span>
                    <span className="text-white/55 font-mono text-sm">
                      {app.version}
                    </span>
                  </div>
                )}
                {app.tech && app.tech.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase block mb-3">
                      Stack
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {app.tech.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] font-mono text-white/40 px-2 py-1 border border-white/10 rounded-lg"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Atmospheric warning */}
            <div className="flex items-start gap-3 mb-6 opacity-40">
              <span className="material-symbols-outlined text-sm font-light text-white/60 mt-px shrink-0">
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
        <div className="shrink-0 px-8 py-6 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <button
            onClick={onEnter}
            className="w-full group relative h-13 bg-white/[0.03] border border-white/20 hover:border-white/50 hover:bg-white/8 transition-all duration-500 flex items-center justify-center gap-4 cursor-pointer rounded-full overflow-hidden py-4"
          >
            <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors font-light">
              play_circle
            </span>
            <span className="text-white/50 font-light tracking-[0.3em] text-[11px] uppercase group-hover:text-white transition-colors">
              Enter Chamber
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
