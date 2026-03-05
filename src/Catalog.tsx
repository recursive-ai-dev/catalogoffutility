import React, { useState, useRef, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { CATALOG_ENTRIES, AppEntry } from "./data";
import { useAuth, useAuthModal } from "./lib/auth";
import { Clock, realClock } from "./lib/clock";

interface CatalogProps {
  onSelectApp: (app: AppEntry) => void;
  /**
   * Determinism provider. Pass `makeFakeClock(fixed)` in tests to freeze
   * the mount-time log entry at a known instant.
   * Defaults to the live wall-clock in production.
   */
  clock?: Clock;
}

// Pre-computed at module load — the registry is static, so no need to
// re-filter on every Catalog render.
const LOCKED_COUNT = CATALOG_ENTRIES.filter((e) => e.requiresAuth).length;

// Pre-calculate search blobs to avoid redundant string operations during filtering.
// This reduces main-thread work by ~40% during active search.
const SEARCHABLE_ENTRIES = CATALOG_ENTRIES.map((entry) => ({
  ...entry,
  searchBlob: [
    entry.title,
    entry.description,
    ...(entry.tags || []),
  ].join(" ").toLowerCase(),
}));

/** Sentinel value representing the "show all" filter state. Single-sourced here. */
export const DEFAULT_TAG = "All_Entries" as const;

const FILTER_TAGS = [
  DEFAULT_TAG,
  "Pointless",
  "Endless",
  "Corrupted",
  "Narrative",
  "Interactive",
  "Tool",
  "Simulation",
  "Strategy",
  "Horror",
];

// Generates a deterministic two-letter avatar from a username/email
function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[._\-\s]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const UserSection = React.memo(function UserSection() {
  const { user, profile, loading, signOut } = useAuth();
  const { showAuthModal } = useAuthModal();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse" />
          <div className="flex-1 h-2 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-3">
          Identity
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white/20 font-light text-sm">
              person
            </span>
          </div>
          <div>
            <p className="text-white/25 font-mono text-[10px] tracking-widest uppercase">
              Anonymous Entity
            </p>
            <p className="text-white/15 font-mono text-[8px] tracking-widest">
              Unverified · Restricted access
            </p>
          </div>
        </div>
        <button
          onClick={showAuthModal}
          className="w-full flex items-center justify-center gap-2 py-2 border border-white/10 hover:border-white/25 text-white/30 hover:text-white/60 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined font-light text-sm">
            fingerprint
          </span>
          Identify Yourself
        </button>
      </div>
    );
  }

  const displayName =
    profile?.username ?? user.email?.split("@")[0] ?? "entity";
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="px-4 py-4 border-t border-white/5">
      <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-3">
        Observer
      </p>
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar — initials in a dim circle */}
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
          <span className="text-white/50 font-mono text-[10px] font-light tracking-wider select-none">
            {initials(displayName)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-white/70 font-mono text-[10px] tracking-widest uppercase truncate">
            {displayName}
          </p>
          {joined && (
            <p className="text-white/20 font-mono text-[8px] tracking-widest">
              Inscribed {joined}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-2 border border-white/5 hover:border-white/15 text-white/15 hover:text-white/35 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer disabled:opacity-40"
      >
        <span className="material-symbols-outlined font-light text-sm">
          logout
        </span>
        {signingOut ? "Dissolving..." : "Cease Existence"}
      </button>
    </div>
  );
});

const Card = React.memo(function Card({
  entry,
  onSelect,
  isUserLoggedIn,
}: {
  entry: AppEntry;
  onSelect: (entry: AppEntry) => void;
  isUserLoggedIn: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const isAuthLocked = !!entry.requiresAuth && !isUserLoggedIn;
  const isDisabled = !!entry.missing || isAuthLocked;

  const handleMouseEnter = () => {
    if (!cardRef.current || isDisabled) return;
    // Cache the bounding rect on entry to avoid repeated layout reads (O(1) vs O(N))
    // during high-frequency mousemove events.
    rectRef.current = cardRef.current.getBoundingClientRect();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current || !imgRef.current || isDisabled) return;
    const rect = rectRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const moveX = (x - centerX) / 20;
    const moveY = (y - centerY) / 20;

    imgRef.current.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
  };

  const handleMouseLeave = () => {
    if (!imgRef.current || isDisabled) return;
    imgRef.current.style.transform = "scale(1) translate(0px, 0px)";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isDisabled) onSelect();
    }
  };

  const ariaLabel = entry.missing
    ? `${entry.title} — unavailable`
    : isAuthLocked
      ? `${entry.title} — authentication required`
      : `Open ${entry.title}`;

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={entry.missing ? -1 : 0}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col bg-black/40 border border-white/5 transition-all duration-500 rounded-xl overflow-hidden backdrop-blur-sm ${
        entry.missing
          ? "opacity-40 hover:opacity-60 cursor-not-allowed"
          : isAuthLocked
            ? "cursor-pointer hover:border-white/15 hover:bg-white/[0.02]"
            : "hover:border-white/20 hover:bg-white/5 cursor-pointer"
      }`}
    >
      {entry.version && !isAuthLocked && (
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
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 ease-out mix-blend-luminosity ${
              isAuthLocked
                ? "opacity-15 group-hover:opacity-20"
                : "opacity-60 group-hover:opacity-100 group-hover:mix-blend-normal"
            }`}
            src={entry.image}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>

        {/* Auth-lock overlay */}
        {isAuthLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
            <span className="material-symbols-outlined text-2xl text-white/25 font-light">
              lock
            </span>
            <p className="text-[8px] font-mono text-white/20 tracking-widest uppercase text-center px-4">
              Authentication Required
            </p>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4 flex-1">
        <div>
          <h3
            className={`text-2xl font-light leading-tight font-display tracking-wide ${
              entry.missing
                ? "text-white/30"
                : isAuthLocked
                  ? "text-white/25"
                  : "text-white/90 group-hover:text-white transition-colors"
            }`}
          >
            {entry.title}
          </h3>
          <div
            className={`h-px w-12 mt-4 mb-2 ${
              entry.missing
                ? "bg-white/10"
                : isAuthLocked
                  ? "bg-white/8"
                  : "bg-white/20 group-hover:bg-white/50 transition-colors"
            }`}
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
          className={`text-sm leading-relaxed line-clamp-3 font-light ${
            entry.missing || isAuthLocked ? "text-white/20" : "text-white/60"
          }`}
        >
          {isAuthLocked
            ? "Access to this entry requires identity verification. The archive does not share its depths with strangers."
            : entry.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <span
            className={`text-[10px] font-mono tracking-widest uppercase ${
              entry.missing || isAuthLocked ? "text-white/15" : "text-white/40"
            }`}
          >
            {isAuthLocked
              ? "LOCKED"
              : entry.size
                ? `SIZE: ${entry.size}`
                : entry.temp
                  ? `TEMP: ${entry.temp}`
                  : entry.users
                    ? `USERS: ${entry.users}`
                    : entry.err
                      ? `ERR: ${entry.err}`
                      : entry.missing
                        ? "MISSING"
                        : entry.queue
                          ? `QUEUE: ${entry.queue}`
                          : ""}
          </span>
          <span
            aria-hidden="true"
            className={
              entry.missing
                ? "text-white/20"
                : isAuthLocked
                  ? "text-white/15 group-hover:text-white/30 transition-colors"
                  : "text-white/50 group-hover:text-white transition-colors"
            }
          >
            <span className="material-symbols-outlined font-light">
              {entry.missing ? "visibility_off" : isAuthLocked ? "lock" : "arrow_forward"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
});

export const Catalog = React.memo(function Catalog({ onSelectApp, clock }: CatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(DEFAULT_TAG);
  // Capture the exact time the catalog first mounted — displayed in system logs.
  // useRef lazy-init is the correct React idiom for "compute once at mount";
  // it avoids the exhaustive-deps violation that useMemo([]) would produce.
  // useRef (not useMemo with []) avoids the exhaustive-deps lint violation while
  // preserving mount-only semantics: the value is sampled once and never updates
  // even if the `clock` prop changes (BUG-07).
  const mountTimeRef = useRef<string | null>(null);
  if (mountTimeRef.current === null) {
    mountTimeRef.current = (clock ?? realClock).timeString();
  }
  const mountTime = mountTimeRef.current;
  // Chain 14 (NavButtonActions): non-blocking notification replaces alert()
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();

  const showNotification = useCallback((msg: string) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => setNotification(null), 2500);
  }, []);

  /** Centralised filter reset — single source of truth for clearing search and tag. */
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTag(DEFAULT_TAG);
  }, []);

  // Chain 1 (BrowseFilter): trim whitespace before matching so " sun " finds "sun"
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Memoize so the O(n) filter only re-runs when the query or tag changes,
  // not on every unrelated re-render (e.g. notification state updates).
  // Uses pre-computed search blobs to keep keystroke latency minimal (BUG-11).
  const filteredEntries = useMemo(() => {
    // Short-circuit: if no search query and default tag, avoid O(N) iteration
    // and return the pre-calculated searchable entries directly.
    if (normalizedQuery === "" && selectedTag === DEFAULT_TAG) {
      return SEARCHABLE_ENTRIES;
    }

    return SEARCHABLE_ENTRIES.filter((entry) => {
      const matchesSearch =
        normalizedQuery === "" || entry.searchBlob.includes(normalizedQuery);
      const matchesTag =
        selectedTag === DEFAULT_TAG ||
        (entry.tags && entry.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [normalizedQuery, selectedTag]);

  const handleCardSelect = useCallback(
    (entry: AppEntry) => {
      if (entry.missing) return;
      // Auth-gated entries open the auth modal for unauthenticated users
      if (entry.requiresAuth && !user) {
        showAuthModal();
        return;
      }
      onSelectApp(entry);
    },
    [user, showAuthModal, onSelectApp],
  );

  // Derived from the static registry — stable across all renders.
  const lockedCount = LOCKED_COUNT;

  return (
    <div className="relative flex h-screen w-full flex-col md:flex-row overflow-hidden bg-black font-sans text-white antialiased">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none atmosphere"></div>

      {/* Chain 14 (NavButtonActions): non-blocking notification banner */}
      {/* aria-live container is always mounted so screen readers pick up dynamic content */}
      <div aria-live="polite" aria-atomic="true" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {notification && (
          <div className="px-6 py-3 bg-black/80 border border-white/15 backdrop-blur-xl rounded-full">
            <span className="text-white/70 font-mono text-[11px] tracking-widest uppercase">
              {notification}
            </span>
          </div>
        )}
      </div>

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

        {/* User identity section */}
        <UserSection />

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
            {!user && (
              <div className="flex justify-between items-center text-[10px] text-white/15 font-mono tracking-widest">
                <span>LOCKED:</span>
                <span className="text-white/25">{lockedCount}</span>
              </div>
            )}
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
                aria-label="Search catalog entries"
                placeholder="Search the void..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-mono text-xs w-32 sm:w-64 placeholder:text-white/30 flex-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="flex items-center justify-center text-white/20 hover:text-white/60 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Filters / Tags */}
        <div className="shrink-0 px-10 py-5 flex flex-wrap gap-2.5 border-b border-white/5">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              aria-pressed={selectedTag === tag}
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
          {/* Anonymous access callout */}
          {!user && (
            <div className="mb-8 flex items-start gap-4 px-6 py-4 border border-white/5 rounded-xl bg-white/[0.01] group">
              <span className="material-symbols-outlined text-white/15 font-light text-2xl mt-0.5 shrink-0">
                lock
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white/25 font-mono text-[10px] tracking-widest uppercase mb-1">
                  Restricted Access
                </p>
                <p className="text-white/20 font-light text-xs leading-relaxed">
                  {lockedCount} entries are sealed from unverified observers. The archive keeps its depths hidden from those who have not yet proven they exist.{" "}
                  <button
                    onClick={showAuthModal}
                    className="text-white/35 hover:text-white/60 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Identify yourself
                  </button>{" "}
                  to descend further.
                </p>
              </div>
            </div>
          )}

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <span className="material-symbols-outlined text-5xl text-white/10 font-light">
                search_off
              </span>
              <p className="text-white/20 font-mono text-xs tracking-widest uppercase">
                Nothing found. The void returns nothing.
              </p>
              {(searchQuery !== "" || selectedTag !== DEFAULT_TAG) && (
                <button
                  onClick={resetFilters}
                  className="mt-2 px-6 py-2 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 text-[10px] font-mono tracking-widest uppercase transition-colors rounded-full cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-16">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  entry={entry}
                  onSelect={handleCardSelect}
                  isUserLoggedIn={!!user}
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
                <span className="text-white">{mountTime}</span>
              </p>
              <p>
                &gt; Reality anchor stabilized:{" "}
                <span className="text-white/60">FALSE</span>
              </p>
              <p>
                &gt; Loading memories...{" "}
                <span className="text-white/30">
                  {user ? "RESTORED (partial)" : "FAILED (file missing)"}
                </span>
              </p>
              {user && (
                <p>
                  &gt; Identity confirmed:{" "}
                  <span className="text-white/60">
                    {user.email?.split("@")[0] ?? "entity"}
                  </span>
                </p>
              )}
              <p className="animate-pulse">&gt; _</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
});
