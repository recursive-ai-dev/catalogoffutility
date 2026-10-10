/**
 * Focus utilities for overlay/modal surfaces.
 *
 * Both `AuthModal` and the Chamber asset viewer are `aria-modal="true"`
 * surfaces. WCAG 2.1 SC 2.1.2 requires that keyboard focus cannot escape them
 * while open, and the standard modal pattern requires that focus be returned to
 * the element that opened them on close. This module is the single
 * implementation of both halves.
 */

/**
 * Selector for elements that can receive focus. Mirrors the conventional modal
 * pattern: links, enabled form controls, and anything with a non-negative
 * tabindex.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Visibility test for focus-trap purposes.
 *
 * Deliberately does NOT use `offsetParent === null`: that is always null in
 * jsdom (so the trap is untestable) and is also null for any
 * `position: fixed` element in real browsers (so the trap silently no-ops on
 * fixed overlays — which is exactly what both modals here are).
 */
function isRendered(el: HTMLElement): boolean {
  if (el.hidden || el.closest("[hidden]") !== null) return false;
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!style) return true;
  return style.display !== "none" && style.visibility !== "hidden";
}

/**
 * Returns the focusable descendants of `root`, in DOM order, excluding anything
 * not currently rendered.
 */
export function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const result: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((el) => {
    if (isRendered(el)) result.push(el);
  });
  return result;
}

/**
 * Wraps a `Tab` / `Shift+Tab` keydown at the boundary of `root`, moving focus
 * from the last focusable element back to the first (and vice versa).
 *
 * Returns `true` when the event was handled and its default prevented, so
 * callers can tell whether the trap engaged.
 */
export function trapTabFocus(
  e: { key: string; shiftKey: boolean; preventDefault: () => void },
  root: HTMLElement | null,
  activeElement: Element | null,
): boolean {
  if (e.key !== "Tab") return false;
  const focusable = getFocusableElements(root);
  if (focusable.length === 0) return false;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && activeElement === first) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && activeElement === last) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
