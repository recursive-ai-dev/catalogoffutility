import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { CATALOG_ENTRIES } from "../data";
import { withViewTransition } from "../lib/navigation";
import { setReducedMotion } from "./matchMedia";

vi.mock("../lib/supabase", () => ({
  supabaseAvailable: false,
  supabase: {},
}));

afterEach(() => {
  setReducedMotion(false);
  Reflect.deleteProperty(document, "startViewTransition");
});

function installTransition(start: (...args: unknown[]) => unknown) {
  Object.defineProperty(document, "startViewTransition", { configurable: true, value: start });
}

describe("navigation animation failure recovery", () => {
  it("commits once when starting an animation throws", () => {
    const update = vi.fn();
    installTransition(() => { throw new Error("snapshots unavailable"); });
    withViewTransition(update);
    expect(update).toHaveBeenCalledOnce();
  });

  it("ignores a failed animation after the update has already committed", async () => {
    const update = vi.fn();
    installTransition((callback) => {
      (callback as () => void)();
      return { ready: Promise.reject(new Error("snapshot skipped")), updateCallbackDone: Promise.reject(new Error("animation")), finished: Promise.reject(new Error("animation")) };
    });
    withViewTransition(update);
    await Promise.resolve();
    expect(update).toHaveBeenCalledOnce();
  });

  it("recovers if the browser never called its rejected update callback", async () => {
    const update = vi.fn();
    installTransition(() => ({ updateCallbackDone: Promise.reject(new Error("snapshot")) }));
    withViewTransition(update);
    await Promise.resolve();
    expect(update).toHaveBeenCalledOnce();
  });

  it("prevents an earlier delayed transition from overwriting newer navigation", () => {
    const callbacks: Array<() => void> = [];
    const skip = vi.fn();
    installTransition((callback) => {
      callbacks.push(callback as () => void);
      return { skipTransition: skip };
    });
    const oldUpdate = vi.fn();
    const newUpdate = vi.fn();
    withViewTransition(oldUpdate);
    withViewTransition(newUpdate);
    callbacks[1]();
    callbacks[0]();
    expect(oldUpdate).not.toHaveBeenCalled();
    expect(newUpdate).toHaveBeenCalledOnce();
    expect(skip).toHaveBeenCalled();
  });

  it("bypasses animation under reduced motion", () => {
    const start = vi.fn();
    installTransition(start);
    setReducedMotion(true);
    const update = vi.fn();
    withViewTransition(update);
    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnce();
  });
});

describe("navigation focus and scroll", () => {
  const entry = CATALOG_ENTRIES.find(app => !app.missing && !app.requiresAuth)!;

  it("focuses each destination and restores the catalog scroll position", () => {
    render(<App />);
    const catalog = document.getElementById("main-content")!;
    catalog.scrollTop = 420;
    fireEvent.click(screen.getByRole("button", { name: `Open ${entry.title}` }));
    const product = document.getElementById("main-content")!;
    expect(product).toHaveFocus();
    expect(product.scrollTop).toBe(0);
    fireEvent.keyDown(window, { key: "Escape" });
    const restored = document.getElementById("main-content")!;
    expect(restored).toHaveFocus();
    expect(restored.scrollTop).toBe(420);
  });

  it("skip link focuses the main landmark without mutating the URL", () => {
    render(<App />);
    const hash = window.location.hash;
    fireEvent.click(screen.getByRole("link", { name: "Skip to main content" }));
    expect(document.getElementById("main-content")).toHaveFocus();
    expect(window.location.hash).toBe(hash);
  });

  it("keeps an already selected category when navigating back through a product tag", () => {
    render(<App />);
    const tag = entry.tags![0];
    const categories = screen.getByRole("group", { name: "Catalog categories" });
    fireEvent.click(within(categories).getByRole("button", { name: tag }));
    fireEvent.click(screen.getByRole("button", { name: `Open ${entry.title}` }));
    fireEvent.click(screen.getByRole("button", { name: `Filter by ${tag}` }));
    expect(within(screen.getByRole("group", { name: "Catalog categories" })).getByRole("button", { name: tag })).toHaveAttribute("aria-pressed", "true");
  });

  it("works when the browser invokes transitions asynchronously", async () => {
    installTransition((callback) => {
      const updateCallbackDone = Promise.resolve().then(callback as () => void);
      return { updateCallbackDone, finished: updateCallbackDone };
    });
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: `Open ${entry.title}` })));
    expect(screen.getByRole("button", { name: /Enter Chamber/i })).toBeInTheDocument();
  });
});
