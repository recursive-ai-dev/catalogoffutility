import React, { useState, useEffect, useCallback } from "react";
import { Catalog, DEFAULT_TAG } from "./Catalog";
import { Chamber } from "./Chamber";
import { ProductPage } from "./ProductPage";
import { AppEntry } from "./data";
import { AuthProvider, useAuth, useAuthModal } from "./lib/auth";
import { AuthModal } from "./AuthModal";
import { PrivacyBanner } from "./PrivacyBanner";

type View = "catalog" | "product" | "chamber";

/** Wraps a state update in the View Transitions API when available, falling back gracefully. */
function withViewTransition(update: () => void): void {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(update);
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
  const [selectedTag, setSelectedTag] = useState(DEFAULT_TAG);
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const { authModalVisible, showAuthModal } = useAuthModal();

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTag(tag);
    if (view !== "catalog") {
      withViewTransition(() => {
        setView("catalog");
        setSelectedApp(null);
      });
    }
  }, [view]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Stabilize handlers by depending on derived primitives (isLoggedIn) instead of the full user object.
  // This prevents the Catalog from re-rendering when irrelevant user profile properties change.
  const handleSelectApp = useCallback(
    (app: AppEntry) => {
      // Chain 2 (AppSelection): single authoritative guard — missing entries are never navigated to.
      // Auth-gated entries are also intercepted here so selectedApp never drifts to a value
      // the current user is not permitted to hold (LC-N).
      if (app.missing) return;
      if (app.requiresAuth && !isLoggedIn) {
        showAuthModal();
        return;
      }
      withViewTransition(() => {
        setSelectedApp(app);
        setView("product");
      });
    },
    [isLoggedIn, showAuthModal],
  );

  const handleEnterChamber = useCallback(() => {
    // Chain 9 (EnterChamber): invariant — can only enter chamber when an app is selected
    if (!selectedApp) return;
    withViewTransition(() => setView("chamber"));
  }, [selectedApp]);

  const handleBackToCatalog = useCallback(() => {
    // Chain 12 (BackNavigation): atomically clear selection and return to catalog
    withViewTransition(() => {
      setView("catalog");
      setSelectedApp(null);
    });
  }, []);

  const handleBackToProduct = useCallback(() => {
    // Chain 12 (BackNavigation): invariant — can only return to product when an app is selected
    if (!selectedApp) {
      withViewTransition(() => setView("catalog"));
      return;
    }
    withViewTransition(() => setView("product"));
  }, [selectedApp]);

  // Derive effective view at render time to prevent auth-gated pages from
  // flashing before the useEffect runs.
  const isUnauthorized = !isLoggedIn && selectedApp?.requiresAuth;
  const effectiveView = isUnauthorized ? "catalog" : view;

  // Dynamic Metadata: update document title and description based on current state
  useEffect(() => {
    if (effectiveView === "product" && selectedApp) {
      document.title = `${selectedApp.title} | Catalog of Futility`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", selectedApp.description);
      }
    } else if (effectiveView === "chamber" && selectedApp) {
      document.title = `[CHAMBER] ${selectedApp.title}`;
    } else {
      document.title = "Catalog of Futility";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", "A brutalist archive of digital artifacts, simulations, and interactive tragedies.");
      }
    }
  }, [effectiveView, selectedApp]);

  // If a logged-out user somehow reaches a product or chamber view for an
  // auth-gated entry, synchronise the underlying view state so that logging
  // back in does not silently teleport them back to the gated page.
  useEffect(() => {
    if (!isLoggedIn && selectedApp?.requiresAuth && view !== "catalog") {
      setView("catalog");
      setSelectedApp(null);
    }
  }, [isLoggedIn, selectedApp, view]);

  // Use effectiveView in render (not raw `view`) so that auth-gated pages
  // never flash for a frame before the useEffect above fires on logout.
  const content = (() => {
    if (effectiveView === "chamber" && selectedApp) {
      return <Chamber app={selectedApp} onBack={handleBackToProduct} />;
    }

    if (effectiveView === "product" && selectedApp) {
      return (
        <ProductPage
          app={selectedApp}
          onBack={handleBackToCatalog}
          onEnter={handleEnterChamber}
          onTagSelect={handleTagSelect}
        />
      );
    }

    return (
      <Catalog
        onSelectApp={handleSelectApp}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onTagSelect={handleTagSelect}
      />
    );
  })();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-6 focus:left-6 focus:z-[100] focus:px-6 focus:py-3 focus:bg-white focus:text-black focus:font-mono focus:text-[10px] focus:tracking-widest focus:uppercase focus:rounded-full focus:shadow-2xl transition-all"
      >
        Skip to Content
      </a>
      {content}
      {authModalVisible && <AuthModal />}
      <PrivacyBanner />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
