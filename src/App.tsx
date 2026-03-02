import React, { useState, useEffect } from "react";
import { Catalog } from "./Catalog";
import { Chamber } from "./Chamber";
import { ProductPage } from "./ProductPage";
import { AppEntry } from "./data";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthModal } from "./AuthModal";
import { PrivacyBanner } from "./PrivacyBanner";

type View = "catalog" | "product" | "chamber";

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
  const { user, authModalVisible, showAuthModal } = useAuth();

  const handleSelectApp = (app: AppEntry) => {
    // Chain 2 (AppSelection): single authoritative guard — missing entries are never navigated to.
    // Auth-gated entries are also intercepted here so selectedApp never drifts to a value
    // the current user is not permitted to hold (LC-N).
    if (app.missing) return;
    if (app.requiresAuth && !user) {
      showAuthModal();
      return;
    }
    setSelectedApp(app);
    setView("product");
  };

  const handleEnterChamber = () => {
    // Chain 9 (EnterChamber): invariant — can only enter chamber when an app is selected
    if (!selectedApp) return;
    setView("chamber");
  };

  const handleBackToCatalog = () => {
    // Chain 12 (BackNavigation): atomically clear selection and return to catalog
    setView("catalog");
    setSelectedApp(null);
  };

  const handleBackToProduct = () => {
    // Chain 12 (BackNavigation): invariant — can only return to product when an app is selected
    if (!selectedApp) {
      setView("catalog");
      return;
    }
    setView("product");
  };

  // Derive effective view at render time to prevent auth-gated pages from
  // flashing before the useEffect runs.
  const isUnauthorized = !user && selectedApp?.requiresAuth;
  const effectiveView = isUnauthorized ? "catalog" : view;

  // If a logged-out user somehow reaches a product or chamber view for an
  // auth-gated entry, quietly return them to the catalog.
  useEffect(() => {
    if (!user && selectedApp?.requiresAuth && view !== "catalog") {
      setView("catalog");
      setSelectedApp(null);
    }
  }, [user, selectedApp, view]);

  if (view === "chamber" && selectedApp) {
    return <Chamber app={selectedApp} onBack={handleBackToProduct} />;
  }

  if (view === "product" && selectedApp) {
    return (
      <ProductPage
        app={selectedApp}
        onBack={handleBackToCatalog}
        onEnter={handleEnterChamber}
      />
    );
  }

  return (
    <>
      <Catalog onSelectApp={handleSelectApp} />
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
