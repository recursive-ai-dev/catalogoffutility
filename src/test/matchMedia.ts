/**
 * `matchMedia` stub for jsdom.
 *
 * jsdom does not implement `matchMedia` at all. Components currently guard it
 * with `?.`, which silently selects the "motion allowed" branch — meaning the
 * `prefers-reduced-motion` paths were unreachable from tests. This stub defaults
 * to "no preference" and can be flipped per-test with `setReducedMotion`.
 */
import { vi } from "vitest";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let reducedMotion = false;

type Listener = (ev: { matches: boolean; media: string }) => void;

function makeStub(query: string): MediaQueryList {
  const listeners = new Set<Listener>();
  const mql = {
    get matches() {
      return query === REDUCED_MOTION_QUERY ? reducedMotion : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: Listener) => {
      listeners.add(cb);
    },
    removeEventListener: (_: string, cb: Listener) => {
      listeners.delete(cb);
    },
    addListener: (cb: Listener) => listeners.add(cb),
    removeListener: (cb: Listener) => listeners.delete(cb),
    dispatchEvent: () => false,
  };
  return mql as unknown as MediaQueryList;
}

/** Installs the stub on the current window. Safe to call more than once. */
export function installMatchMediaStub(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => makeStub(query)),
  });
}

/** Forces the result of `matchMedia("(prefers-reduced-motion: reduce)")`. */
export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
}
