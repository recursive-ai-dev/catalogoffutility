import React, { useState } from "react";
import { Catalog } from "./Catalog";
import { Chamber } from "./Chamber";
import { ProductPage } from "./ProductPage";
import { AppEntry } from "./data";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthModal } from "./AuthModal";

type View = "catalog" | "product" | "chamber";

function AppInner() {
  const [view, setView] = useState<View>("catalog");
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null);
  const { user, authModalVisible } = useAuth();

  const handleSelectApp = (app: AppEntry) => {
    // Chain 2 (AppSelection): single authoritative guard — missing entries are never navigated to
    if (app.missing) return;
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

  // If a logged-out user somehow reaches a product or chamber view for an
  // auth-gated entry, quietly return them to the catalog.
  if (!user && selectedApp?.requiresAuth && view !== "catalog") {
    setView("catalog");
    setSelectedApp(null);
  }

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
