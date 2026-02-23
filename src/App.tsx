import React, { useState } from "react";
import { Catalog } from "./Catalog";
import { Chamber } from "./Chamber";
import { AppEntry } from "./data";

export default function App() {
  const [activeApp, setActiveApp] = useState<AppEntry | null>(null);

  if (activeApp) {
    return <Chamber app={activeApp} onBack={() => setActiveApp(null)} />;
  }

  return <Catalog onSelectApp={setActiveApp} />;
}
