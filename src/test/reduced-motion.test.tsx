/**
 * `prefers-reduced-motion` support.
 *
 * docs/ux-foundation.md §8 mandates that the CRT overlay, glitch animation and
 * atmosphere layer all stop for users who ask for reduced motion, and §1
 * requires transitions to convey state rather than decorate. Neither was
 * implemented: the block was documented in the spec and absent from
 * `index.css`, so the scanline and flicker animations ran for everyone.
 *
 * `matchMedia` is stubbed by `src/test/matchMedia.ts` (jsdom has no
 * implementation), which is what makes the Chamber's scroll behaviour
 * reachable from a test for the first time.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, cleanup } from "@testing-library/react";
import { setReducedMotion } from "./matchMedia";
import { Chamber } from "../Chamber";
import { AppEntry } from "../data";

const INDEX_CSS = readFileSync(path.resolve(process.cwd(), "src/index.css"), "utf8");

const app: AppEntry = {
  id: "test-app",
  title: "TEST APP",
  description: "A test description",
  image: "https://example.com/img.jpg",
  url: "/test-app.html",
};

let scrollArgs: Array<ScrollIntoViewOptions | boolean | undefined> = [];
const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeEach(() => {
  scrollArgs = [];
  Element.prototype.scrollIntoView = vi.fn(function (
    this: Element,
    arg?: ScrollIntoViewOptions | boolean,
  ) {
    scrollArgs.push(arg);
  });
  setReducedMotion(false);
});

afterEach(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
  setReducedMotion(false);
  cleanup();
});

describe("index.css reduced-motion block", () => {
  const block = INDEX_CSS.slice(INDEX_CSS.indexOf("@media (prefers-reduced-motion: reduce)"));

  it("exists", () => {
    expect(INDEX_CSS).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it.each([
    ".crt-overlay",
    ".crt-scanline",
    ".glitch-hover:hover",
    ".atmosphere",
    ".animate-flicker",
    ".animate-glitch",
    ".animate-pulse",
    ".animate-ping",
    ".animate-spin",
    "::view-transition-old(root)",
    "::view-transition-new(root)",
  ])("stops animation on %s", (selector) => {
    expect(block).toContain(selector);
  });

  it("disables both animation and transition inside the block", () => {
    expect(block).toContain("animation: none;");
    expect(block).toContain("transition: none;");
  });
});

describe("Chamber log scrolling honours the preference", () => {
  it("scrolls smoothly when motion is allowed", () => {
    render(<Chamber app={app} onBack={vi.fn()} />);
    expect(scrollArgs).toContainEqual({ behavior: "smooth", block: "end" });
  });

  it("jumps without animating when reduced motion is preferred", () => {
    setReducedMotion(true);
    render(<Chamber app={app} onBack={vi.fn()} />);
    expect(scrollArgs).toContainEqual({ behavior: "auto", block: "end" });
    expect(scrollArgs).not.toContainEqual({ behavior: "smooth", block: "end" });
  });
});
