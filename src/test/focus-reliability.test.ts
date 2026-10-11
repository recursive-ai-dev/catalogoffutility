import { afterEach, describe, expect, it, vi } from "vitest";
import { getFocusableElements, trapTabFocus } from "../lib/focus";
const roots: HTMLElement[] = [];
function root(html: string) {
  const element = document.createElement("div"); element.innerHTML = html;
  document.body.appendChild(element); roots.push(element); return element;
}
function ids(element: HTMLElement) { return getFocusableElements(element).map((item) => item.id); }
function key(shiftKey = false) { return { key: "Tab", shiftKey, preventDefault: vi.fn() }; }
afterEach(() => { roots.forEach((element) => element.remove()); roots.length = 0; });

describe("focusable dialog targets", () => {
  it("excludes every negative tabindex, including native controls", () => {
    expect(ids(root('<button id="ok">OK</button><button id="minus-one" tabindex="-1">Hidden</button><div id="minus-two" tabindex="-2"></div>'))).toEqual(["ok"]);
  });
  it("excludes disabled fieldset descendants while respecting its first legend", () => {
    expect(ids(root('<fieldset disabled><legend><button id="legend">Legend</button></legend><button id="disabled">Disabled</button></fieldset><button id="ok">OK</button>'))).toEqual(["legend", "ok"]);
  });
  it("excludes hidden input fields and inert descendants", () => {
    expect(ids(root('<input id="hidden" type="hidden"><div inert><button id="inert">Inert</button></div><button id="ok">OK</button>'))).toEqual(["ok"]);
  });
  it("excludes controls inside an ancestor hidden with CSS", () => {
    expect(ids(root('<div style="display:none"><button id="hidden">Hidden</button></div><button id="ok">OK</button>'))).toEqual(["ok"]);
  });
  it("excludes controls with collapsed visibility", () => {
    expect(ids(root('<button id="collapsed" style="visibility:collapse">Collapsed</button><button id="ok">OK</button>'))).toEqual(["ok"]);
  });
  it("includes children that explicitly override inherited hidden visibility", () => {
    expect(ids(root('<div style="visibility:hidden"><button id="shown" style="visibility:visible">Shown</button></div>'))).toEqual(["shown"]);
  });
  it("includes top-level editable surfaces but skips implicit nested editors", () => {
    expect(ids(root('<div id="editor" contenteditable="true"><div id="nested" contenteditable="true"></div></div><div id="off" contenteditable="false"></div>'))).toEqual(["editor"]);
  });
  it("orders positive tabindexes before normal DOM order", () => {
    expect(ids(root('<button id="normal">Normal</button><button id="second" tabindex="2">Second</button><button id="first" tabindex="1">First</button>'))).toEqual(["first", "second", "normal"]);
  });
  it("selects the checked radio as its group tab stop", () => {
    expect(ids(root('<input id="a" type="radio" name="choice"><input id="b" type="radio" name="choice" checked><button id="end">End</button>'))).toEqual(["b", "end"]);
  });
  it("selects the first enabled radio when none is checked", () => {
    expect(ids(root('<input id="a" disabled type="radio" name="choice"><input id="b" type="radio" name="choice"><input id="c" type="radio" name="choice">'))).toEqual(["b"]);
  });
  it("keeps radio groups in different forms distinct", () => {
    expect(ids(root('<form><input id="a" type="radio" name="choice"></form><form><input id="b" type="radio" name="choice"></form>'))).toEqual(["a", "b"]);
  });
  it("includes a closed details summary while excluding its collapsed content", () => {
    expect(ids(root('<details><summary id="summary">Summary</summary><button id="hidden">Hidden</button></details>'))).toEqual(["summary"]);
  });
  it("excludes controls in detached roots", () => {
    const element = root('<button>Detached</button>'); element.remove();
    expect(getFocusableElements(element)).toEqual([]);
  });
});

describe("focus containment", () => {
  it("moves focus into the first tab stop when it starts outside the dialog", () => {
    const element = root('<button id="a">A</button><button id="b">B</button>');
    const event = key(); expect(trapTabFocus(event, element, document.body)).toBe(true);
    expect(document.activeElement?.id).toBe("a"); expect(event.preventDefault).toHaveBeenCalled();
  });
  it("moves reverse navigation into the last tab stop from outside", () => {
    const element = root('<button id="a">A</button><button id="b">B</button>');
    expect(trapTabFocus(key(true), element, null)).toBe(true); expect(document.activeElement?.id).toBe("b");
  });
  it("keeps focus on a dialog with no available tab stops", () => {
    const element = root('<button disabled>Unavailable</button>'); const event = key();
    expect(trapTabFocus(event, element, document.body)).toBe(true);
    expect(document.activeElement).toBe(element); expect(element.tabIndex).toBe(-1);
  });
  it("does not override keyboard events already handled by a child control", () => {
    const element = root('<button>A</button>'); const event = { ...key(), defaultPrevented: true };
    expect(trapTabFocus(event, element, document.body)).toBe(false); expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
