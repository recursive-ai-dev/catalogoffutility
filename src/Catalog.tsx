import React, { useState, useRef, useCallback } from "react";
import { CATALOG_ENTRIES, AppEntry } from "./data";

interface CatalogProps {
  onSelectApp: (app: AppEntry) => void;
}

const FILTER_TAGS = [
  "All_Entries",
  "Pointless",
  "Endless",
  "Corrupted",
  "Narrative",
  "Interactive",
  "Tool",
  "Simulation",
];

function Card({
  entry,
  onSelect,
}: {
  entry: AppEntry;
  onSelect: () => void;
  key?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !imgRef.current || entry.missing) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const moveX = (x - centerX) / 20;
    const moveY = (y - centerY) / 20;

    imgRef.current.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
  };

  const handleMouseLeave = () => {
    if (!imgRef.current || entry.missing) return;
    imgRef.current.style.transform = "scale(1) translate(0px, 0px)";
  };

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col bg-black/40 border border-white/5 transition-all duration-500 rounded-xl overflow-hidden backdrop-blur-sm ${entry.missing ? "opacity-40 hover:opacity-60 cursor-not-allowed" : "hover:border-white/20 hover:bg-white/5 cursor-pointer"}`}
    >
      {entry.version && (
        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          <span className="text-[9px] text-white/70 font-mono uppercase tracking-widest">
            {entry.version}
          </span>
        </div>
      )}

      <div className="aspect-[4/3] w-full overflow-hidden bg-black relative flex items-center justify-center">
        {entry.missing ? (
          <>
            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-pulse"></div>
            <span className="material-symbols-outlined text-3xl text-white/20 absolute font-light">
              visibility_off
            </span>
          </>
        ) : (
          <img
            ref={imgRef}
            alt={entry.title}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out opacity-60 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal`}
            src={entry.image}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
      </div>

      <div className="p-6 flex flex-col gap-4 flex-1">
        <div>
          <h3
            className={`text-2xl font-light leading-tight font-display tracking-wide ${entry.missing ? "text-white/30" : "text-white/90 group-hover:text-white transition-colors"}`}
          >
            {entry.title}
          </h3>
          <div
            className={`h-px w-12 mt-4 mb-2 ${entry.missing ? "bg-white/10" : "bg-white/20 group-hover:bg-white/50 transition-colors"}`}
          ></div>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 border border-white/8 text-white/25 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p
          className={`text-sm leading-relaxed line-clamp-3 font-light ${entry.missing ? "text-white/30" : "text-white/60"}`}
        >
          {entry.description}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span
            className={`text-[10px] font-mono tracking-widest uppercase ${entry.missing ? "text-white/20" : "text-white/40"}`}
          >
            {entry.size && `SIZE: ${entry.size}`}
            {entry.temp && `TEMP: ${entry.temp}`}
            {entry.users && `USERS: ${entry.users}`}
            {entry.err && `ERR: ${entry.err}`}
            {entry.missing && `MISSING`}
            {entry.queue && `QUEUE: ${entry.queue}`}
          </span>
          <button
            className={
              entry.missing
                ? "text-white/20 cursor-not-allowed"
                : "text-white/50 hover:text-white transition-colors"
            }
          >
            <span className="material-symbols-outlined font-light">
              {entry.missing ? "lock" : "arrow_forward"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Catalog({ onSelectApp }: CatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All_Entries");
  // Chain 14 (NavButtonActions): non-blocking notification replaces alert()
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((msg: string) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => setNotification(null), 2500);
  }, []);

  // Chain 1 (BrowseFilter): trim whitespace before matching so " sun " finds "sun"
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredEntries = CATALOG_ENTRIES.filter((entry) => {
    const matchesSearch =
      normalizedQuery === "" ||
      entry.title.toLowerCase().includes(normalizedQuery) ||
      entry.description.toLowerCase().includes(normalizedQuery);
    const matchesTag =
      selectedTag === "All_Entries" ||
      (entry.tags && entry.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="relative flex h-screen w-full flex-col md:flex-row overflow-hidden bg-black font-sans text-white antialiased">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none atmosphere"></div>

      {/* Chain 14 (NavButtonActions): non-blocking notification banner */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-black/80 border border-white/15 backdrop-blur-xl rounded-full pointer-events-none">
          <span className="text-white/70 font-mono text-[11px] tracking-widest uppercase">
            {notification}
          </span>
        </div>
      )}

      {/* Side Navigation */}
      <div className="w-full md:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-black/40 backdrop-blur-xl z-20">
        <div className="p-8 border-b border-white/10 flex flex-col gap-2">
          <h1 className="text-white/90 text-3xl font-light tracking-widest uppercase font-display">
            The Void
          </h1>
          <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase">
            Archive // v2.0.0
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <button
            className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left"
            onClick={() => showNotification("Time is already wasted.")}
          >
            <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light">
              schedule
            </span>
            <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
              Waste Time
            </span>
          </button>
          <button
            className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-white/10 bg-white/5 transition-all duration-300 cursor-pointer w-full text-left"
            onClick={() => showNotification("Memories purged.")}
          >
            <span className="material-symbols-outlined text-white text-xl font-light">
              delete
            </span>
            <span className="text-white font-light uppercase tracking-widest text-xs">
              Forget
            </span>
          </button>
          <button
            className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left"
            onClick={() => showNotification("Giving up is not an option.")}
          >
            <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light">
              cancel
            </span>
            <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
              Give Up
            </span>
          </button>
          <div className="h-px bg-white/10 my-4 w-full"></div>
          <button
            className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left"
            onClick={() => showNotification("Staring into the void...")}
          >
            <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light">
              block
            </span>
            <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
              Void
            </span>
          </button>
          <button
            className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left"
            onClick={() => showNotification("Exit mechanism destroyed.")}
          >
            <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light">
              warning
            </span>
            <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
              Exit (Broken)
            </span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/40">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[10px] text-white/40 font-mono tracking-widest">
              <span>STATUS:</span>
              <span className="text-white/80">FADING</span>
            </div>
            <div className="h-px w-full bg-white/10 rounded overflow-hidden">
              <div className="h-full bg-white/40 w-[85%]"></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-white/20 font-mono tracking-widest mt-1">
              <span>ENTRIES:</span>
              <span className="text-white/40">{CATALOG_ENTRIES.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="shrink-0 h-24 border-b border-white/10 flex items-center justify-between px-10 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-light text-white uppercase tracking-widest font-display">
              The Archive
            </h2>
            <div className="hidden sm:flex px-3 py-1 bg-white/5 border border-white/10 text-[9px] text-white/50 font-mono tracking-widest uppercase rounded-full">
              {filteredEntries.length} of {CATALOG_ENTRIES.length} Entries
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-white/40 text-sm bg-black/40 border border-white/10 rounded-full px-4 py-2 focus-within:border-white/30 transition-colors">
              <span className="material-symbols-outlined text-base font-light">
                search
              </span>
              <input
                type="text"
                placeholder="Search the void..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-mono text-xs w-32 sm:w-64 placeholder:text-white/30"
              />
            </div>
          </div>
        </header>

        {/* Filters / Tags */}
        <div className="shrink-0 px-10 py-5 flex flex-wrap gap-2.5 border-b border-white/5">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-5 py-2 border text-[10px] font-light uppercase tracking-widest transition-all rounded-full cursor-pointer ${
                selectedTag === tag
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-white/10 text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid Content */}
        <main className="flex-1 overflow-y-auto px-10 py-6 scroll-smooth void-scroll">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <span className="material-symbols-outlined text-5xl text-white/10 font-light">
                search_off
              </span>
              <p className="text-white/20 font-mono text-xs tracking-widest uppercase">
                Nothing found. The void returns nothing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-16">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  entry={entry}
                  onSelect={() => !entry.missing && onSelectApp(entry)}
                />
              ))}
            </div>
          )}

          {/* Footer Logs */}
          <div className="mt-auto pt-10 border-t border-white/10">
            <h3 className="text-white/80 text-xs font-light tracking-widest uppercase mb-6 px-1 font-mono">
              System_Logs
            </h3>
            <div className="font-mono text-[10px] text-white/40 flex flex-col gap-2 opacity-70">
              <p>
                &gt; Observer accessed the void at{" "}
                <span className="text-white">00:00:00</span>
              </p>
              <p>
                &gt; Reality anchor stabilized:{" "}
                <span className="text-white/60">FALSE</span>
              </p>
              <p>
                &gt; Loading memories...{" "}
                <span className="text-white/30">FAILED (file missing)</span>
              </p>
              <p className="animate-pulse">&gt; _</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
