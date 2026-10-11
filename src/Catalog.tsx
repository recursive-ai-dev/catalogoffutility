import React, { useState, useRef, useCallback, useMemo, useEffect, useDeferredValue } from "react";
import { X } from "lucide-react";
import { CATALOG_ENTRIES, FILTER_TAGS, AppEntry } from "./data";
import { useAuth, useAuthModal } from "./lib/auth";
import { Clock, realClock } from "./lib/clock";
import { ARCHIVE_CORRUPTION, DEFAULT_TAG } from "./lib/constants";
import { resolvePublicAssetUrl } from "./lib/assets";
import {
  buildCatalogSearchIndex,
  filterCatalogEntries,
  isCatalogDialogOpen,
  isEditingCatalogText,
  normalizeCatalogSearch,
  type SearchableEntry,
} from "./lib/catalog";

/**
 * Re-exported for backwards compatibility: the "show all" sentinel now lives in
 * `lib/constants` so that `data.ts` can build the filter chip list from it
 * without a circular import back into this component.
 */
export { DEFAULT_TAG };

interface CatalogProps {
  onSelectApp: (app: AppEntry) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string;
  onTagSelect: (tag: string) => void;
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

// The static registry is indexed once, outside React's render path.
const SEARCH_INDEX = buildCatalogSearchIndex(CATALOG_ENTRIES);

/**
 * Pre-allocated formatter for "MMM YYYY" profile dates.
 * 30-50x faster than calling toLocaleDateString() in every render.
 */
const PROFILE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
});

const EMAIL_CLEAN_REGEX = /@.*/;
const INITIALS_REGEX = /(?:^|[._\-\s])([\p{L}\p{N}_])/gu;
const INITIAL_CLEAN_REGEX = /^[._\-\s]+/;
const FALLBACK_CLEAN_REGEX = /[^a-zA-Z0-9]/g;

// Generates a deterministic two-letter avatar from a username/email.
// Optimized to use a single regex match for initials extraction while preserving
// underscore/dot/dash boundaries, reducing multiple array allocations.
function initials(name: string): string {
  const cleanName = name.replace(EMAIL_CLEAN_REGEX, "");
  const matches = cleanName.matchAll(INITIALS_REGEX);
  const parts: string[] = [];
  for (const match of matches) {
    parts.push(match[1]);
    if (parts.length === 2) break;
  }

  if (parts.length >= 2) return (parts[0] + parts[1]).toUpperCase();
  if (parts.length === 1) return cleanName.replace(INITIAL_CLEAN_REGEX, "").slice(0, 2).toUpperCase();
  const fallback = cleanName.replace(FALLBACK_CLEAN_REGEX, "").slice(0, 2);
  return (fallback.length > 0 ? fallback : "??").toUpperCase();
}

const UserSection = React.memo(function UserSection() {
  const { user, profile, loading, signOut } = useAuth();
  const { showAuthModal } = useAuthModal();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const signOutInFlightRef = useRef(false);

  // All hooks must run on every render, unconditionally, BEFORE any early
  // return. These three previously sat below the `loading` / `!user` guards, so
  // the component executed 3 hooks while signed out and 6 once a session
  // arrived — React aborts that render with "Rendered more hooks than during the
  // previous render", blanking the catalog on every successful sign-in.
  const displayName = useMemo(
    () => profile?.username?.trim() || user?.email?.split("@")[0] || "entity",
    [profile?.username, user?.email],
  );

  const joined = useMemo(() => {
    if (!profile?.created_at) return null;
    const date = new Date(profile.created_at);
    return Number.isNaN(date.getTime()) ? null : PROFILE_DATE_FORMATTER.format(date);
  }, [profile?.created_at]);

  const userInitials = useMemo(() => initials(displayName), [displayName]);

  const handleSignOut = async () => {
    if (signOutInFlightRef.current) return;
    signOutInFlightRef.current = true;
    setSignOutError(null);
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSignOutError("Sign-out failed. Please try again.");
    } finally {
      signOutInFlightRef.current = false;
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div role="group" aria-label="Loading identity" aria-busy="true" className="px-4 py-4 border-t border-white/5">
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
            <span aria-hidden="true" className="material-symbols-outlined text-white/20 font-light text-sm">
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
          type="button"
          onClick={showAuthModal}
          className="w-full flex items-center justify-center gap-2 py-2 border border-white/10 hover:border-white/25 text-white/30 hover:text-white/60 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined font-light text-sm">
            fingerprint
          </span>
          Identify Yourself
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-white/5">
      <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-3">
        Observer
      </p>
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar — initials in a dim circle */}
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
          <span className="text-white/50 font-mono text-[10px] font-light tracking-wider select-none">
            {userInitials}
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
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-2 border border-white/5 hover:border-white/15 text-white/15 hover:text-white/35 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer disabled:opacity-40"
      >
        <span aria-hidden="true" className="material-symbols-outlined font-light text-sm">
          logout
        </span>
        {signingOut ? "Dissolving..." : "Cease Existence"}
      </button>
      {signOutError && <p role="alert" className="mt-2 text-xs text-white/70">{signOutError}</p>}
    </div>
  );
});

export const CatalogCard = React.memo(function CatalogCard({
  entry,
  onSelect,
  onTagSelect,
  isUserLoggedIn,
}: {
  entry: AppEntry;
  onSelect: (entry: AppEntry) => void;
  onTagSelect: (tag: string) => void;
  isUserLoggedIn: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const transformRef = useRef("");
  const motionQueryRef = useRef<MediaQueryList | null>(null);
  const imageSource = resolvePublicAssetUrl(entry.image);
  const [imageState, setImageState] = useState({ source: imageSource, failed: false });
  // A corrected source starts a new preview attempt, including a return to an older URI.
  if (imageState.source !== imageSource) setImageState({ source: imageSource, failed: false });
  const imageFailed = imageState.source === imageSource && imageState.failed;

  const isAuthLocked = !!entry.requiresAuth && !isUserLoggedIn;
  const isDisabled = !!entry.missing || isAuthLocked;

  const handleMouseEnter = () => {
    motionQueryRef.current ??= window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    if (!cardRef.current || isDisabled || motionQueryRef.current?.matches) return;
    // Cache the bounding rect on entry to avoid repeated layout reads (O(1) vs O(N))
    // during high-frequency mousemove events.
    rectRef.current = cardRef.current.getBoundingClientRect();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (motionQueryRef.current?.matches) {
      handleMouseLeave();
      return;
    }
    if (!rectRef.current || !imgRef.current || isDisabled) return;
    const rect = rectRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const moveX = (x - centerX) / 20;
    const moveY = (y - centerY) / 20;

    transformRef.current = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        if (imgRef.current) imgRef.current.style.transform = motionQueryRef.current?.matches ? "" : transformRef.current;
      });
    }
  };

  const handleMouseLeave = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    rectRef.current = null;
    if (imgRef.current) imgRef.current.style.transform = "";
  };

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const ariaLabel = entry.missing
    ? `${entry.title} — unavailable`
    : isAuthLocked
      ? `${entry.title} — authentication required`
      : `Open ${entry.title}`;

  return (
    <article
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-labelledby={`entry-title-${entry.id}`}
      className={`group relative flex flex-col bg-black/40 border border-white/5 transition-all duration-500 rounded-xl overflow-hidden backdrop-blur-sm ${
        entry.missing
          ? "opacity-40 hover:opacity-60 cursor-not-allowed"
          : isAuthLocked
            ? "cursor-pointer hover:border-white/15 hover:bg-white/[0.02]"
            : "hover:border-white/20 hover:bg-white/5 cursor-pointer"
      }`}
    >
      {/*
        Stretched activation target. A real <button> gives us native keyboard
        activation, a native accessible name and a browser-managed focus ring,
        so the card no longer has to fake button semantics — and the tag filter
        buttons below can sit above it without being nested inside a button.
      */}
      {!entry.missing && (
        <button
          type="button"
          onClick={() => onSelect(entry)}
          aria-label={ariaLabel}
          aria-describedby={`entry-description-${entry.id}`}
          className="absolute inset-0 z-20 rounded-xl cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/40"
        />
      )}
      {entry.version && !isAuthLocked && (
        <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          <span className="text-[9px] text-white/70 font-mono uppercase tracking-widest">
            {entry.version}
          </span>
        </div>
      )}

      <div className="aspect-[4/3] w-full overflow-hidden bg-black relative flex items-center justify-center">
        {entry.missing || imageFailed ? (
          <>
            <div className="w-full h-full bg-white/5" aria-hidden="true"></div>
            <span aria-hidden="true" className="material-symbols-outlined text-3xl text-white/20 absolute font-light">
              visibility_off
            </span>
          </>
        ) : (
          <img
            key={imageSource}
            ref={imgRef}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out mix-blend-luminosity ${
              isAuthLocked
                ? "opacity-15 group-hover:opacity-20"
                : "opacity-60 group-hover:opacity-100 group-hover:mix-blend-normal"
            }`}
            src={imageSource}
            onError={(event) => {
              if (event.currentTarget === imgRef.current) setImageState({ source: imageSource, failed: true });
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>

        {/* Auth-lock overlay */}
        {isAuthLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
            <span aria-hidden="true" className="material-symbols-outlined text-2xl text-white/25 font-light">
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
          <h2
            id={`entry-title-${entry.id}`}
            className={`text-2xl font-light leading-tight font-display tracking-wide ${
              entry.missing
                ? "text-white/30"
                : isAuthLocked
                  ? "text-white/25"
                  : "text-white/90 group-hover:text-white transition-colors"
            }`}
          >
            {entry.title}
          </h2>
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
          <div className="relative z-30 flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagSelect(tag)}
                aria-label={`Filter by ${tag}`}
                aria-controls="catalog-results"
                className="text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 border border-white/8 text-white/25 rounded-full hover:border-white/30 hover:text-white/60 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <p
          id={`entry-description-${entry.id}`}
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
            {entry.missing
              ? "MISSING"
              : isAuthLocked
              ? "LOCKED"
              : entry.size
                ? `SIZE: ${entry.size}`
                : entry.temp
                  ? `TEMP: ${entry.temp}`
                  : entry.users
                    ? `USERS: ${entry.users}`
                    : entry.err
                      ? `ERR: ${entry.err}`
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
    </article>
  );
});

const Sidebar = React.memo(function Sidebar({
  onSelectApp,
  resetFilters,
  showNotification,
  lockedCount,
  corruption,
}: {
  onSelectApp: (app: AppEntry) => void;
  resetFilters: () => void;
  showNotification: (msg: string) => void;
  lockedCount: number;
  corruption: number;
}) {
  const { user } = useAuth();
  const [isConfirmingForget, setIsConfirmingForget] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleForgetClick = () => {
    if (isConfirmingForget) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setIsConfirmingForget(false);
      resetFilters();
      showNotification("Memories purged.");
    } else {
      setIsConfirmingForget(true);
      confirmTimerRef.current = setTimeout(() => {
        setIsConfirmingForget(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  return (
    <aside aria-label="Archive controls" className="w-full md:w-72 shrink-0 max-h-[35dvh] md:max-h-none overflow-y-auto md:overflow-hidden flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-black/40 backdrop-blur-xl z-20">
      <div className="p-4 md:p-8 border-b border-white/10 flex flex-col gap-2">
        <p className="text-white/90 text-3xl font-light tracking-widest uppercase font-display">
          The Void
        </p>
        <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase">
          Archive // v2.0.0
        </p>
      </div>

      <nav aria-label="Archive actions" className="flex-1 md:overflow-y-auto py-3 md:py-6 px-4 grid grid-cols-2 md:flex md:flex-col gap-2">
        <button
          type="button"
          className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
          onClick={() => {
            const navigable = CATALOG_ENTRIES.filter((e) => !e.missing && (!e.requiresAuth || user));
            if (navigable.length > 0) {
              const randomApp = navigable[Math.floor(Math.random() * navigable.length)];
              onSelectApp(randomApp);
            } else {
              showNotification("No path found in the void.");
            }
          }}
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light" aria-hidden="true">
            schedule
          </span>
          <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
            Waste Time
          </span>
        </button>
        <button
          className={`group flex items-center gap-4 px-4 py-3 rounded-lg border transition-all duration-300 cursor-pointer w-full text-left focus-visible:ring-1 focus-visible:ring-white/30 outline-none ${
            isConfirmingForget
              ? "border-red-900/50 bg-red-950/20"
              : "border-white/10 bg-white/5"
          }`}
          type="button"
          onClick={handleForgetClick}
          aria-label={isConfirmingForget ? "Confirm: Forget memories" : "Forget memories"}
        >
          <span
            className={`material-symbols-outlined text-xl font-light transition-colors ${
              isConfirmingForget ? "text-red-500/70" : "text-white"
            }`}
            aria-hidden="true"
          >
            {isConfirmingForget ? "priority_high" : "delete"}
          </span>
          <span
            className={`font-light uppercase tracking-widest text-xs transition-colors ${
              isConfirmingForget ? "text-red-500/70" : "text-white"
            }`}
          >
            {isConfirmingForget ? "Are you sure?" : "Forget"}
          </span>
        </button>
        <button
          className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
          type="button"
          onClick={() => showNotification("Giving up is not an option.")}
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light" aria-hidden="true">
            cancel
          </span>
          <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
            Give Up
          </span>
        </button>
        <div className="h-px bg-white/10 my-4 w-full col-span-2" aria-hidden="true"></div>
        <button
          className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
          type="button"
          onClick={() => showNotification("Staring into the void...")}
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light" aria-hidden="true">
            block
          </span>
          <span className="text-white/60 font-light group-hover:text-white uppercase tracking-widest text-xs">
            Void
          </span>
        </button>
        <button
          className="group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-white/5 transition-all duration-300 cursor-pointer w-full text-left focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
          type="button"
          onClick={() => showNotification("Exit mechanism destroyed.")}
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors text-xl font-light" aria-hidden="true">
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
          <div
            className="h-px w-full bg-white/10 rounded overflow-hidden"
            role="progressbar"
            aria-valuenow={corruption}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Archive stability"
            aria-valuetext={`${corruption}% corruption, critical`}
          >
            <div className="h-full bg-white/40 relative" style={{ width: `${corruption}%` }}></div>
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
    </aside>
  );
});

const SearchHeader = React.memo(function SearchHeader({
  searchQuery,
  onSearchChange,
  searchInputRef,
  filteredEntriesCount,
  totalEntriesCount,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  filteredEntriesCount: number;
  totalEntriesCount: number;
}) {
  return (
    <header className="shrink-0 min-h-24 border-b border-white/10 flex flex-col xl:flex-row gap-4 xl:items-center justify-between px-4 sm:px-8 lg:px-10 py-5 bg-black/20 backdrop-blur-md z-10">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <h1 id="catalog-title" className="text-3xl sm:text-4xl font-light text-white uppercase tracking-widest font-display">
          The Archive
        </h1>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex px-3 py-1 bg-white/5 border border-white/10 text-[9px] text-white/50 font-mono tracking-widest uppercase rounded-full"
        >
          {filteredEntriesCount} of {totalEntriesCount} Entries
        </p>
      </div>
      <div className="flex items-center gap-4 min-w-0">
        <div
          role="search"
          aria-label="Catalog search"
          className="flex items-center gap-3 text-white/40 text-sm bg-black/40 border border-white/10 rounded-full px-4 py-2 focus-within:border-white/30 transition-colors w-full xl:w-80 min-w-0"
        >
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            className="flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            aria-label="Focus search input"
          >
            <span className="material-symbols-outlined text-base font-light" aria-hidden="true">
              search
            </span>
          </button>
          <input
            ref={searchInputRef}
            type="search"
            name="catalog-search"
            aria-label="Search catalog entries (Press / to focus)"
            aria-keyshortcuts="/"
            aria-controls="catalog-results"
            placeholder="Search the void..."
            maxLength={200}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-white font-mono text-xs w-full min-w-0 placeholder:text-white/30 flex-1 focus-visible:ring-1 focus-visible:ring-white/30 rounded-sm"
          />
          <span className="text-[10px] text-white/20 font-mono select-none pointer-events-none" aria-hidden="true">
            [/]
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex items-center justify-center text-white/20 hover:text-white/60 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none rounded-full"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

const FilterBar = React.memo(function FilterBar({
  selectedTag,
  onTagSelect,
  counts,
}: {
  selectedTag: string;
  onTagSelect: (tag: string) => void;
  counts: ReadonlyMap<string, number>;
}) {
  return (
    <div role="group" aria-label="Catalog categories" className="shrink-0 px-4 sm:px-8 lg:px-10 py-4 flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 border-b border-white/5">
      {FILTER_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onTagSelect(tag)}
          aria-label={tag}
          aria-describedby={`filter-count-${tag}`}
          aria-controls="catalog-results"
          aria-pressed={selectedTag === tag}
          className={`shrink-0 whitespace-nowrap px-5 py-2 border text-[10px] font-light uppercase tracking-widest transition-all rounded-full cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none ${
            selectedTag === tag
              ? "bg-white/10 border-white/20 text-white"
              : "bg-transparent border-white/10 text-white/50 hover:border-white/30 hover:text-white"
          }`}
        >
          {tag}
          <span aria-hidden="true" className="ml-2 opacity-60">{counts.get(tag) ?? 0}</span>
          <span id={`filter-count-${tag}`} className="sr-only">{counts.get(tag) ?? 0} matching entries</span>
        </button>
      ))}
    </div>
  );
});

const EntryGrid = React.memo(function EntryGrid({
  filteredEntries,
  onSelectApp,
  onTagSelect,
  isUserLoggedIn,
  isFilterActive,
  resetFilters,
  searchInputRef,
  lockedCount,
  showAuthModal,
  mountTime,
  userDisplayName,
  isPending,
}: {
  filteredEntries: SearchableEntry[];
  onSelectApp: (app: AppEntry) => void;
  onTagSelect: (tag: string) => void;
  isUserLoggedIn: boolean;
  isFilterActive: boolean;
  resetFilters: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  lockedCount: number;
  showAuthModal: () => void;
  mountTime: string;
  userDisplayName: string | null;
  isPending: boolean;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-labelledby="catalog-title"
      aria-busy={isPending}
      className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-10 py-6 scroll-smooth void-scroll outline-none"
    >
      {/* Anonymous access callout */}
      {!isUserLoggedIn && (
        <div className="mb-8 flex items-start gap-4 px-6 py-4 border border-white/5 rounded-xl bg-white/[0.01] group">
          <span aria-hidden="true" className="material-symbols-outlined text-white/15 font-light text-2xl mt-0.5 shrink-0">
            lock
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white/25 font-mono text-[10px] tracking-widest uppercase mb-1">
              Restricted Access
            </p>
            <p className="text-white/20 font-light text-xs leading-relaxed">
              {lockedCount} entries are sealed from unverified observers. The archive keeps its depths hidden from those who have not yet proven they exist.{" "}
              <button
                type="button"
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

      <section id="catalog-results" aria-label="Catalog entries">
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span aria-hidden="true" className="material-symbols-outlined text-5xl text-white/10 font-light">
            search_off
          </span>
          <p className="text-white/20 font-mono text-xs tracking-widest uppercase">
            Nothing found. The void returns nothing.
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={() => {
                resetFilters();
                searchInputRef.current?.focus();
              }}
              className="mt-2 px-6 py-2 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 text-[10px] font-mono tracking-widest uppercase transition-colors rounded-full cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4 sm:gap-8 pb-16">
          {filteredEntries.map((entry) => (
            <CatalogCard
              key={entry.id}
              entry={entry}
              onSelect={onSelectApp}
              onTagSelect={onTagSelect}
              isUserLoggedIn={isUserLoggedIn}
            />
          ))}
        </div>
      )}
      </section>

      {/* Footer Logs */}
      <div className="mt-auto pt-10 border-t border-white/10">
        <h2 className="text-white/80 text-xs font-light tracking-widest uppercase mb-6 px-1 font-mono">
          System_Logs
        </h2>
        <div className="font-mono text-[10px] text-white/40 flex flex-col gap-2 opacity-70">
          <p>
            &gt; Observer accessed the void at <span className="text-white">{mountTime}</span>
          </p>
          <p>
            &gt; Reality anchor stabilized: <span className="text-white/60">FALSE</span>
          </p>
          <p>
            &gt; Loading memories...{" "}
            <span className="text-white/30">
              {isUserLoggedIn ? "RESTORED (partial)" : "FAILED (file missing)"}
            </span>
          </p>
          {isUserLoggedIn && (
            <p>
              &gt; Identity confirmed:{" "}
              <span className="text-white/60">{userDisplayName ?? "entity"}</span>
            </p>
          )}
          <p className="animate-pulse">&gt; _</p>
        </div>
      </div>
    </main>
  );
});

export const Catalog = React.memo(function Catalog({
  onSelectApp,
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  clock,
}: CatalogProps) {
  // Double-memoization: normalize the raw query before deferring it.
  // This prevents irrelevant changes (like case or trailing spaces) from
  // triggering a deferred re-filter.
  const normalizedQuery = useMemo(
    () => normalizeCatalogSearch(searchQuery),
    [searchQuery],
  );
  const deferredQuery = useDeferredValue(normalizedQuery);

  // Whether any filter is currently narrowing the grid. Mirrored into a ref so
  // the global keydown listener can read the latest value without having to
  // re-register on every keystroke.
  const isFilterActive = searchQuery !== "" || selectedTag !== DEFAULT_TAG;
  const isFilterActiveRef = useRef(isFilterActive);
  useEffect(() => {
    isFilterActiveRef.current = isFilterActive;
  }, [isFilterActive]);

  const searchInputRef = useRef<HTMLInputElement>(null);
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

  /** Centralised filter reset — single source of truth for clearing search and tag. */
  const resetFilters = useCallback(() => {
    onSearchChange("");
    onTagSelect(DEFAULT_TAG);
    // Maintain interaction momentum by restoring focus to the search input.
    searchInputRef.current?.focus();
  }, [onSearchChange, onTagSelect]);

  // "/" and "Escape" shortcut handler — only triggers when no modifier keys are pressed,
  // not during IME composition, and when focus is not already in an input/textarea/contentEditable.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      const activeElement = e.target instanceof Element ? e.target : document.activeElement;
      const isInputFocused = isEditingCatalogText(activeElement);
      if (isCatalogDialogOpen(activeElement)) return;

      if (e.key === "Escape") {
        // Only clear when something is actually filtered; firing resetFilters()
        // unconditionally re-focused the search input on every stray Escape and
        // announced an empty aria-live region for no reason.
        if (!isFilterActiveRef.current || (isInputFocused && activeElement !== searchInputRef.current)) return;
        e.preventDefault();
        resetFilters();
        return;
      }

      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetFilters]);

  const showNotification = useCallback((msg: string) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => setNotification(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // Memoize so the O(n) filter only re-runs when the query or tag changes,
  // not on every unrelated re-render (e.g. notification state updates).
  // Uses pre-computed search blobs to keep keystroke latency minimal (BUG-11).
  // React 19: Uses deferredQuery to prioritize input responsiveness over
  // expensive filtering operations.
  const matchingEntries = useMemo(() => filterCatalogEntries(SEARCH_INDEX, deferredQuery), [deferredQuery]);
  const filteredEntries = useMemo(
    () => selectedTag === DEFAULT_TAG
      ? matchingEntries
      : deferredQuery === ""
        ? (SEARCH_INDEX.byTag.get(selectedTag) ?? [])
        : matchingEntries.filter((entry) => entry.tags?.includes(selectedTag)),
    [deferredQuery, matchingEntries, selectedTag],
  );
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>([[DEFAULT_TAG, matchingEntries.length]]);
    for (const entry of matchingEntries) {
      for (const tag of new Set(entry.tags ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return counts;
  }, [matchingEntries]);

  const isLoggedIn = !!user;
  const handleCardSelect = useCallback(
    (entry: AppEntry) => {
      if (entry.missing) return;
      // Auth-gated entries open the auth modal for unauthenticated users
      if (entry.requiresAuth && !isLoggedIn) {
        showAuthModal();
        return;
      }
      onSelectApp(entry);
    },
    [isLoggedIn, showAuthModal, onSelectApp],
  );


  // Derived from the static registry — stable across all renders.
  const lockedCount = LOCKED_COUNT;
  const corruption = ARCHIVE_CORRUPTION;

  const userDisplayName = useMemo(
    () => user?.email?.split("@")[0] ?? null,
    [user],
  );

  return (
    <div className="relative flex h-dvh min-h-0 w-full flex-col md:flex-row overflow-hidden bg-black font-sans text-white antialiased">
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

      <Sidebar
        onSelectApp={handleCardSelect}
        resetFilters={resetFilters}
        showNotification={showNotification}
        lockedCount={lockedCount}
        corruption={corruption}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative z-10">
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchInputRef={searchInputRef}
          filteredEntriesCount={filteredEntries.length}
          totalEntriesCount={CATALOG_ENTRIES.length}
        />

        <FilterBar selectedTag={selectedTag} onTagSelect={onTagSelect} counts={tagCounts} />

        <EntryGrid
          filteredEntries={filteredEntries}
          onSelectApp={handleCardSelect}
          onTagSelect={onTagSelect}
          isUserLoggedIn={isLoggedIn}
          isFilterActive={isFilterActive}
          resetFilters={resetFilters}
          searchInputRef={searchInputRef}
          lockedCount={lockedCount}
          showAuthModal={showAuthModal}
          mountTime={mountTime}
          userDisplayName={userDisplayName}
          isPending={normalizedQuery !== deferredQuery}
        />
      </div>
    </div>
  );
});
