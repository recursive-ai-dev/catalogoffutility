import React, { useState } from "react";
import { Catalog } from "./Catalog";
import { Chamber } from "./Chamber";
import { ProductPage } from "./ProductPage";
import { AppEntry } from "./data";

type View = "catalog" | "product" | "chamber";

export default function App() {
  const [view, setView] = useState<View>("catalog");
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null);

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

  return <Catalog onSelectApp={handleSelectApp} />;
}
