import { describe, it, expect, afterEach } from "vitest";
import { getFocusableElements, trapTabFocus } from "../lib/focus";

function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

let hosts: HTMLElement[] = [];
function tracked(html: string): HTMLElement {
  const el = mount(html);
  hosts.push(el);
  return el;
}

afterEach(() => {
  hosts.forEach((h) => h.remove());
  hosts = [];
});

describe("getFocusableElements", () => {
  it("returns focusable descendants in DOM order", () => {
    const root = tracked(
      `<div><button id="a">A</button><span>text</span><a href="#" id="b">B</a><input id="c"></div>`,
    );
    const ids = getFocusableElements(root).map((el) => el.id);
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("excludes disabled controls and negative tabindexes", () => {
    const root = tracked(
      `<div><button id="ok">ok</button><button id="off" disabled>off</button><div id="neg" tabindex="-1">neg</div></div>`,
    );
    expect(getFocusableElements(root).map((el) => el.id)).toEqual(["ok"]);
  });

  it("excludes elements hidden with the hidden attribute", () => {
    const root = tracked(`<div><button id="shown">s</button><button id="hid" hidden>h</button></div>`);
    expect(getFocusableElements(root).map((el) => el.id)).toEqual(["shown"]);
  });

  /**
   * The previous implementation filtered on `offsetParent !== null`. That is
   * null for every element in jsdom *and* for any `position: fixed` subtree in
   * real browsers — so the trap silently returned an empty list for exactly the
   * fixed overlays both modals are.
   */
  it("finds elements inside a position:fixed overlay, where offsetParent is null", () => {
    const root = tracked(
      `<div style="position: fixed; inset: 0"><div style="position: fixed"><button id="in-fixed">x</button></div></div>`,
    );
    const inner = root.querySelector("div > div") as HTMLElement;
    expect(inner.offsetParent).toBeNull();
    expect(getFocusableElements(root).map((el) => el.id)).toEqual(["in-fixed"]);
  });

  it("returns an empty list for a null root", () => {
    expect(getFocusableElements(null)).toEqual([]);
  });
});

describe("trapTabFocus", () => {
  const key = (k: string, shift = false) => {
    let prevented = false;
    return { e: { key: k, shiftKey: shift, preventDefault: () => (prevented = true) }, prevented: () => prevented };
  };

  it("wraps forward from the last element back to the first", () => {
    const root = tracked(`<div><button id="a">A</button><button id="b">B</button></div>`);
    const last = root.querySelector("#b") as HTMLElement;
    const { e, prevented } = key("Tab");
    expect(trapTabFocus(e, root, last)).toBe(true);
    expect(prevented()).toBe(true);
    expect(document.activeElement?.id).toBe("a");
  });

  it("wraps backward from the first element to the last", () => {
    const root = tracked(`<div><button id="a">A</button><button id="b">B</button></div>`);
    const first = root.querySelector("#a") as HTMLElement;
    const { e, prevented } = key("Tab", true);
    expect(trapTabFocus(e, root, first)).toBe(true);
    expect(prevented()).toBe(true);
    expect(document.activeElement?.id).toBe("b");
  });

  it("does nothing for Tab in the middle of the list", () => {
    const root = tracked(`<div><button id="a">A</button><button id="b">B</button><button id="c">C</button></div>`);
    const middle = root.querySelector("#b") as HTMLElement;
    const { e, prevented } = key("Tab");
    expect(trapTabFocus(e, root, middle)).toBe(false);
    expect(prevented()).toBe(false);
  });

  it("ignores keys other than Tab", () => {
    const root = tracked(`<div><button id="a">A</button></div>`);
    const only = root.querySelector("#a") as HTMLElement;
    expect(trapTabFocus(key("Escape").e, root, only)).toBe(false);
  });
});
