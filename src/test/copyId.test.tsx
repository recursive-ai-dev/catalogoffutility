import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { ProductPage } from "../ProductPage";
import { AppEntry } from "../data";

const makeApp = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: "test-app-id",
  title: "TEST APP",
  description: "A test description",
  image: "https://example.com/img.jpg",
  url: "/test-app.html",
  tags: ["Narrative"],
  tech: ["HTML"],
  version: "v.1.0",
  size: "10 KB",
  ...overrides,
});

describe("ProductPage — Copy ID UX", () => {
  beforeEach(() => {
    // Mock navigator.clipboard
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("copies the entry ID to clipboard and shows feedback", async () => {
    const app = makeApp();
    render(
      <ProductPage
        app={app}
        onBack={vi.fn()}
        onEnter={vi.fn()}
        onTagSelect={vi.fn()}
      />
    );

    const copyBtn = screen.getByLabelText("Copy entry ID");
    expect(copyBtn.textContent).toContain("test-app-id".toUpperCase());

    fireEvent.click(copyBtn);

    await screen.findByText("COPIED");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-app-id");
    expect(screen.getByLabelText("ID copied")).toBeTruthy();
  });

  it("resets feedback state after 2 seconds", async () => {
    vi.useFakeTimers();
    const app = makeApp();
    render(
      <ProductPage
        app={app}
        onBack={vi.fn()}
        onEnter={vi.fn()}
        onTagSelect={vi.fn()}
      />
    );

    const copyBtn = screen.getByLabelText("Copy entry ID");
    fireEvent.click(copyBtn);

    // Since handleCopyId is async and we use fake timers, we need to resolve the promise.
    // However, await screen.findByText("COPIED") won't work well with fake timers if we advance them manually.
    // Let's use a simpler approach.

    // Trigger the async call
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByText("COPIED")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("COPIED")).toBeNull();
    expect(screen.getByLabelText("Copy entry ID")).toBeTruthy();
  });
});
