/**
 * Focus utilities for overlay/modal surfaces.
 *
 * Both `AuthModal` and the Chamber asset viewer are `aria-modal="true"`
 * surfaces. Modal navigation stays within the dialog until the user closes it.
 * These helpers discover tab stops and keep keyboard navigation contained.
 */

/**
 * Selector for elements that can receive focus. Mirrors the conventional modal
 * pattern: links, enabled form controls, and anything with a non-negative
 * tabindex.
 */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  'input:not([type="hidden"])',
  "textarea",
  "select",
  "summary",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  "[tabindex]",
].join(", ");

function isRendered(el: HTMLElement): boolean {
  if (!el.isConnected || el.closest("[hidden], [inert]") !== null) return false;
  const view = el.ownerDocument.defaultView;
  const ownStyle = view?.getComputedStyle(el);
  if (ownStyle?.visibility === "hidden" || ownStyle?.visibility === "collapse") return false;
  // display:none on an ancestor does not change the child's computed display.
  for (let ancestor: HTMLElement | null = el; ancestor; ancestor = ancestor.parentElement) {
    const style = view?.getComputedStyle(ancestor);
    if (style?.display === "none") return false;
    if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
      const summary = ancestor.querySelector(":scope > summary");
      if (!summary?.contains(el)) return false;
    }
  }
  return true;
}

/** Returns the rendered tab stops in the order used by keyboard navigation. */
export function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const elements = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.matches(":disabled") &&
      (element.tabIndex >= 0 || (
        element.hasAttribute("contenteditable") &&
        element.getAttribute("contenteditable") !== "false" &&
        !element.hasAttribute("tabindex") &&
        !element.parentElement?.closest('[contenteditable]:not([contenteditable="false"])')
      )) && isRendered(element));
  // Only the checked radio (or first enabled radio) is a tab stop in its group.
  const tabStops = elements.filter((element) => {
    if (!(element instanceof HTMLInputElement) || element.type !== "radio" || !element.name) return true;
    const group = elements.filter((candidate): candidate is HTMLInputElement =>
      candidate instanceof HTMLInputElement && candidate.type === "radio" &&
      candidate.name === element.name && candidate.form === element.form);
    return element === (group.find((radio) => radio.checked) ?? group[0]);
  });
  return tabStops.sort((a, b) => {
    const aOrder = a.tabIndex > 0 ? a.tabIndex : Number.MAX_SAFE_INTEGER;
    const bOrder = b.tabIndex > 0 ? b.tabIndex : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
}

/** Keeps Tab navigation in a dialog, including when focus starts outside it. */
export function trapTabFocus(
  e: { key: string; shiftKey: boolean; defaultPrevented?: boolean; preventDefault: () => void },
  root: HTMLElement | null,
  activeElement: Element | null,
): boolean {
  if (e.key !== "Tab" || e.defaultPrevented || !root) return false;
  const focusable = getFocusableElements(root);
  if (focusable.length === 0) {
    e.preventDefault();
    if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
    root.focus({ preventScroll: true });
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const outsideTabStops = !focusable.some((element) => element === activeElement);
  if (outsideTabStops || (e.shiftKey ? activeElement === first : activeElement === last)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus({ preventScroll: true });
    return true;
  }
  return false;
}
