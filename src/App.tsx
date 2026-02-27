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
    setSelectedApp(app);
    setView("product");
  };

  const handleEnterChamber = () => {
    setView("chamber");
  };

  const handleBackToCatalog = () => {
    setView("catalog");
    setSelectedApp(null);
  };

  const handleBackToProduct = () => {
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
