import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Catalog, DEFAULT_TAG } from "../Catalog";
import { AuthProvider } from "../lib/auth";
import React from "react";

// Mock implementation for window.scrollTo and scrollIntoView which may be missing in JSDOM
window.scrollTo = vi.fn();
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}

describe("Palette: Keyboard Shortcuts and Hints", () => {
  const mockOnSelectApp = vi.fn();
  const mockOnSearchChange = vi.fn();
  const mockOnTagSelect = vi.fn();

  const renderCatalog = () => {
    return render(
      <AuthProvider>
        <Catalog
          onSelectApp={mockOnSelectApp}
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          selectedTag={DEFAULT_TAG}
          onTagSelect={mockOnTagSelect}
        />
      </AuthProvider>
    );
  };

  it("renders visual keyboard hints in the sidebar", () => {
    renderCatalog();
    expect(screen.getByText("[R]")).toBeTruthy();
    expect(screen.getByText("[Esc]")).toBeTruthy();
  });

  it("has accessible ARIA labels with shortcut info", () => {
    renderCatalog();
    const wasteTimeBtn = screen.getByRole("button", { name: /Waste Time \(Shortcut: R\)/i });
    const forgetBtn = screen.getByRole("button", { name: /Forget \(Shortcut: Escape\)/i });

    expect(wasteTimeBtn).toBeTruthy();
    expect(forgetBtn).toBeTruthy();
  });

  it("triggers handleWasteTime (via onSelectApp) when 'R' is pressed", () => {
    renderCatalog();
    fireEvent.keyDown(window, { key: "r" });
    // handleWasteTime picks a random navigable app and calls onSelectApp
    expect(mockOnSelectApp).toHaveBeenCalled();
  });

  it("triggers handleWasteTime (via onSelectApp) when 'Shift+R' (capital R) is pressed", () => {
    renderCatalog();
    fireEvent.keyDown(window, { key: "R" });
    expect(mockOnSelectApp).toHaveBeenCalled();
  });

  it("does not trigger shortcuts when focused on an input", () => {
    renderCatalog();
    const searchInput = screen.getByPlaceholderText(/Search the void/i);
    searchInput.focus();

    mockOnSelectApp.mockClear();
    fireEvent.keyDown(window, { key: "r" });
    expect(mockOnSelectApp).not.toHaveBeenCalled();
  });
});
