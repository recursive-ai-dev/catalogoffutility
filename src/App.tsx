import React, { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Catalog, DEFAULT_TAG } from "./Catalog";
import { Chamber } from "./Chamber";
import { ProductPage } from "./ProductPage";
import { AppEntry } from "./data";
import { AuthProvider, useAuth, useAuthModal } from "./lib/auth";
import { AuthModal } from "./AuthModal";
import { PrivacyBanner } from "./PrivacyBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import { resetDocumentMeta, setDocumentMeta } from "./lib/metadata";
import { SITE_TITLE, chamberTitle, productTitle } from "./lib/constants";

type View = "catalog" | "product" | "chamber";

/** Wraps a state update in the View Transitions API when available, falling back gracefully. */
function withViewTransition(update: () => void): void {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      flushSync(() => {
        update();
      });
    });
  } else {
    update();
  }
}

/**
 * Manages in-app navigation and selected application state for the catalog, product, and chamber screens.
 *
 * Maintains the current view and selected AppEntry, exposes handlers for selecting an app, entering the chamber,
 * and navigating back, and enforces authentication gating by returning to the catalog when a non-authenticated user
 * attempts to view an auth-required entry.
 *
 * @returns The UI for the active view: Catalog (with optional AuthModal and PrivacyBanner), ProductPage, or Chamber.
 */
function AppInner() {
  const [view, setView] = useState<View>("catalog");
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // `DEFAULT_TAG` is an `as const` literal, so without the annotation the state
  // type collapses to "All_Entries" and every real tag assignment is rejected.
  const [selectedTag, setSelectedTag] = useState<string>(DEFAULT_TAG);
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const { authModalVisible, showAuthModal } = useAuthModal();

  // Track transient state in refs to enable referential stability for callbacks.
  // This prevents the Catalog from re-rendering when the view or selected app changes.
  const viewRef = React.useRef(view);
  const selectedAppRef = React.useRef(selectedApp);
  const isLoggedInRef = React.useRef(isLoggedIn);

  React.useEffect(() => {
    viewRef.current = view;
    selectedAppRef.current = selectedApp;
    isLoggedInRef.current = isLoggedIn;
  });

  const handleTagSelect = useCallback(
    (tag: string) => {
      const update = () => {
        // Toggle tag: if the same tag is selected again, revert to DEFAULT_TAG.
        setSelectedTag((prev) => (prev === tag ? DEFAULT_TAG : tag));
        if (viewRef.current !== "catalog" || selectedAppRef.current !== null) {
          setView("catalog");
          setSelectedApp(null);
        }
      };

      // Performance: Only wrap in transition if a view/selection change is actually happening.
      // Tag filtering within the catalog is fast enough to be synchronous.
      if (viewRef.current !== "catalog" || selectedAppRef.current !== null) {
        withViewTransition(update);
      } else {
        update();
      }
    },
    [],
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Stabilize handlers by using refs for state dependencies.
  // This prevents the Catalog from re-rendering when the user object or current view changes.
  const handleSelectApp = useCallback(
    (app: AppEntry) => {
      // Chain 2 (AppSelection): single authoritative guard — missing entries are never navigated to.
      // Auth-gated entries are also intercepted here so selectedApp never drifts to a value
      // the current user is not permitted to hold (LC-N).
      if (app.missing) return;
      if (app.requiresAuth && !isLoggedInRef.current) {
        showAuthModal();
        return;
      }
      withViewTransition(() => {
        setSelectedApp(app);
        setView("product");
      });
    },
    [showAuthModal],
  );

  const handleEnterChamber = useCallback(() => {
    // Chain 9 (EnterChamber): invariant — can only enter chamber when an app is selected
    if (!selectedAppRef.current) return;
    withViewTransition(() => setView("chamber"));
  }, []);

  const handleBackToCatalog = useCallback(() => {
    // Chain 12 (BackNavigation): atomically clear selection and return to catalog
    withViewTransition(() => {
      setView("catalog");
      setSelectedApp(null);
    });
  }, []);

  const handleBackToProduct = useCallback(() => {
    // Chain 12 (BackNavigation): invariant — can only return to product when an app is selected
    if (!selectedAppRef.current) {
      withViewTransition(() => setView("catalog"));
      return;
    }
    withViewTransition(() => setView("product"));
  }, []);

  // Derive effective view at render time to prevent auth-gated pages from
  // flashing before the useEffect runs.
  const isUnauthorized = !isLoggedIn && selectedApp?.requiresAuth;
  const effectiveView = isUnauthorized ? "catalog" : view;

  // Dynamic metadata. Routed through lib/metadata so the og:/twitter: tags move
  // with the view too — previously they stayed pinned to the generic catalog
  // copy, so sharing a specific entry always previewed as the archive root.
  useEffect(() => {
    if (effectiveView === "product" && selectedApp) {
      setDocumentMeta(productTitle(selectedApp.title), selectedApp.description);
    } else if (effectiveView === "chamber" && selectedApp) {
      setDocumentMeta(chamberTitle(selectedApp.title), selectedApp.description);
    } else {
      resetDocumentMeta(SITE_TITLE);
    }
  }, [effectiveView, selectedApp]);

  // If a logged-out user somehow reaches a product or chamber view for an
  // auth-gated entry, synchronise the underlying view state so that logging
  // back in does not silently teleport them back to the gated page.
  //
  // Written as a render-time state adjustment (the pattern React documents for
  // "adjust state when a prop changes") rather than an effect, so the correction
  // lands in the same commit instead of triggering a second render.
  const [wasLoggedIn, setWasLoggedIn] = useState(isLoggedIn);
  if (wasLoggedIn !== isLoggedIn) {
    setWasLoggedIn(isLoggedIn);
    if (!isLoggedIn && selectedApp?.requiresAuth) {
      setView("catalog");
      setSelectedApp(null);
    }
  }

  // Use effectiveView in render (not raw `view`) so that auth-gated pages
  // never flash for a frame before the useEffect above fires on logout.
  return (
    <>
      {/* Accessibility: Skip to main content link — globalized for all views */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-4 left-4 z-[100] px-6 py-3 bg-white text-black font-mono text-xs tracking-widest uppercase rounded-full shadow-2xl transition-all"
      >
        Skip to main content
      </a>

      {effectiveView === "chamber" && selectedApp ? (
        <Chamber app={selectedApp} onBack={handleBackToProduct} />
      ) : effectiveView === "product" && selectedApp ? (
        <ProductPage
          app={selectedApp}
          onBack={handleBackToCatalog}
          onEnter={handleEnterChamber}
          onTagSelect={handleTagSelect}
        />
      ) : (
        <Catalog
          onSelectApp={handleSelectApp}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
        />
      )}
      {authModalVisible && <AuthModal />}
      <PrivacyBanner />
    </>
  );
}

export default function App() {
  return (
    // Outside AuthProvider: an auth-provider throw must not take the recovery UI
    // down with it.
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
