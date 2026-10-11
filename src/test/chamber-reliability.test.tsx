import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Chamber } from "../Chamber";
import type { AppEntry } from "../data";
import { makeFakeClock } from "../lib/clock";
import { JSDOM } from "jsdom";

const clock = makeFakeClock(new Date("2026-01-01T12:00:00Z"));
const app = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: "reliability", title: "Reliability", description: "Test artifact", image: "/image.png",
  url: "/artifact.html", ...overrides,
});

function initialize(overrides: Partial<AppEntry> = {}) {
  const result = render(<Chamber app={app(overrides)} onBack={vi.fn()} clock={clock} />);
  fireEvent.click(screen.getByRole("button", { name: "Initialize" }));
  return { ...result, iframe: screen.getByTitle("Reliability") as HTMLIFrameElement };
}

function post(iframe: HTMLIFrameElement, data: unknown, origin = window.location.origin) {
  act(() => window.dispatchEvent(new MessageEvent("message", {
    source: iframe.contentWindow, origin, data,
  })));
}

function open(iframe: HTMLIFrameElement, src = "https://example.com/image.png") {
  post(iframe, { type: "IMAGE_CLICKED", src });
}

afterEach(() => vi.useRealTimers());

describe("Chamber session reliability", () => {
  it("ends stalled loads with a retryable error", () => {
    vi.useFakeTimers();
    initialize();
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole("alert")).toHaveTextContent("30 seconds");
    fireEvent.click(screen.getByRole("button", { name: "Re-Initialize" }));
    expect(screen.getByRole("button", { name: "Initialize" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Initialize" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading Assets");
  });

  it("cancels the timeout after a successful load", () => {
    vi.useFakeTimers();
    const { iframe } = initialize();
    expect(iframe).toHaveAttribute("aria-busy", "true");
    expect(iframe).toHaveAttribute("tabindex", "-1");
    fireEvent.load(iframe);
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(iframe).toHaveAttribute("aria-busy", "false");
    expect(iframe).toHaveAttribute("tabindex", "0");
  });

  it("releases outstanding timers when unmounted", () => {
    vi.useFakeTimers();
    const { unmount } = initialize();
    expect(vi.getTimerCount()).toBe(2);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("resets fullscreen, modal, log, and initialization on artifact changes", () => {
    const { iframe, rerender } = initialize();
    fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));
    open(iframe);
    rerender(<Chamber app={app({ id: "second", title: "Second" })} onBack={vi.fn()} clock={clock} />);
    expect(screen.getByRole("button", { name: "Initialize" })).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "Exit fullscreen" })).toBeNull();
    expect(screen.getByRole("log")).not.toHaveTextContent("Intercepted");
  });

  it("resets the session when the same artifact's source changes", () => {
    const { rerender } = initialize();
    rerender(<Chamber app={app({ url: "/replacement.html" })} onBack={vi.fn()} clock={clock} />);
    expect(screen.getByRole("button", { name: "Initialize" })).toBeVisible();
    expect(screen.queryByTitle("Reliability")).toBeNull();
  });

  it("uses the newest clock for a pending initialization log without restarting its timer", () => {
    vi.useFakeTimers();
    const { rerender } = initialize();
    act(() => vi.advanceTimersByTime(1_000));
    const later = makeFakeClock(new Date("2026-01-01T13:00:00Z"));
    rerender(<Chamber app={app()} onBack={vi.fn()} clock={later} />);
    act(() => vi.advanceTimersByTime(1_000));
    const message = screen.getByText("Rendering shadows...").parentElement;
    expect(message).toHaveTextContent("13:00:00");
  });

  it.each([
    { url: undefined, htmlContent: undefined },
    { url: "javascript:alert(1)" },
    { url: "data:text/html,<script>alert(1)</script>" },
    { url: "https://user:secret@example.com/app.html" },
    { url: "https://[invalid" },
  ])("fails unsupported or absent sources before creating an iframe (%j)", (source) => {
    render(<Chamber app={app(source)} onBack={vi.fn()} clock={clock} />);
    fireEvent.click(screen.getByRole("button", { name: "Initialize" }));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByTitle("Reliability")).toBeNull();
  });

  it("inserts the inline bridge before case-insensitive closing body tags and addresses the parent", async () => {
    const { iframe } = initialize({ url: undefined, htmlContent: "<HTML><BODY><img src='x'></BODY ></HTML>" });
    const html = iframe.srcdoc;
    expect(html.indexOf("IMAGE_CLICKED")).toBeLessThan(html.indexOf("</BODY >"));
    expect(html).toContain(JSON.stringify(window.location.origin));
    expect(html).toContain("CHAMBER_ESCAPE");
    expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    await act(async () => {});
  });

  it("intercepts same-origin images directly and removes duplicate injected listeners", () => {
    const { iframe } = initialize();
    const doc = iframe.contentDocument!;
    act(() => { doc.open(); doc.write('<html><body><img src="https://example.com/old.png"></body></html>'); doc.close(); });
    const image = doc.querySelector("img")!;
    Object.defineProperty(image, "currentSrc", { value: "https://example.com/selected.png" });
    const add = vi.spyOn(doc, "addEventListener");
    const remove = vi.spyOn(doc, "removeEventListener");
    fireEvent.load(iframe);
    fireEvent.load(iframe);
    expect(add).toHaveBeenCalledWith("click", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("click", expect.any(Function));
    fireEvent.click(image);
    expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveAttribute("src", "https://example.com/selected.png");
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    expect(screen.getAllByText(/Intercepted image hotlink/)).toHaveLength(1);
  });

  it("detaches the parent listener from the old iframe document on session replacement", () => {
    const { iframe, rerender } = initialize();
    const doc = iframe.contentDocument!;
    fireEvent.load(iframe);
    const remove = vi.spyOn(doc, "removeEventListener");
    rerender(<Chamber app={app({ id: "replacement" })} onBack={vi.fn()} clock={clock} />);
    expect(remove).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("accepts verified messages from the configured external origin", () => {
    const { iframe } = initialize({ url: "https://external.example/app.html" });
    open(iframe);
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    post(iframe, { type: "IMAGE_CLICKED", src: "https://example.com/image.png" }, "https://external.example");
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});

describe("Chamber asset viewer protection", () => {
  it.each([
    "https://example.com/i.png\n", " https://example.com/i.png", "https://example.com/\ti.png",
    "data:image/png;base64,", "data:image/png;base64,a!b", "data:image/png;base64,abc=def",
  ])("rejects ambiguous URLs and malformed image data (%s)", (src) => {
    const { iframe } = initialize();
    open(iframe, src);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each(["DATA:IMAGE/PNG;BASE64,YWJj", "http://[::1]/image.png"])("accepts safe image variants (%s)", (src) => {
    const { iframe } = initialize();
    open(iframe, src);
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("rejects inherited payload fields and array-shaped messages", () => {
    const { iframe } = initialize();
    post(iframe, Object.create({ type: "IMAGE_CLICKED", src: "https://example.com/i.png" }));
    post(iframe, Object.assign([], { type: "IMAGE_CLICKED", src: "https://example.com/i.png" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not invoke message accessors", () => {
    const { iframe } = initialize();
    const getter = vi.fn(() => { throw new Error("Untrusted accessor"); });
    post(iframe, Object.defineProperty({ src: "https://example.com/i.png" }, "type", { get: getter }));
    expect(getter).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps an open viewer stable during repeated or replacement messages and restores the opener", () => {
    const { iframe } = initialize();
    const opener = screen.getByRole("button", { name: "Enter fullscreen" });
    opener.focus();
    open(iframe);
    open(iframe, "https://example.com/replacement.png");
    expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveAttribute("src", "https://example.com/image.png");
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    expect(opener).toHaveFocus();
    expect(screen.getAllByText(/Intercepted image hotlink/)).toHaveLength(1);
  });

  it("makes background controls inert and hides them from assistive technology", () => {
    const { iframe, container } = initialize();
    open(iframe);
    const background = container.querySelector("[inert]");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button", { name: "Back to product page" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close image viewer" }));
    expect(screen.getByRole("button", { name: "Back to product page" })).toBeVisible();
  });

  it("reports asset failures and does not send a referrer for extracted images", () => {
    const { iframe } = initialize();
    open(iframe);
    const image = within(screen.getByRole("dialog")).getByRole("img");
    expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    fireEvent.error(image);
    expect(screen.getByText("This image could not be loaded.")).toHaveAttribute("role", "status");
  });

  it("honors consumed Escape keys and ignores composition", () => {
    const onBack = vi.fn();
    render(<Chamber app={app()} onBack={onBack} clock={clock} />);
    const consumed = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    consumed.preventDefault();
    fireEvent(window, consumed);
    fireEvent.keyDown(window, { key: "Escape", isComposing: true });
    expect(onBack).not.toHaveBeenCalled();
  });

  it("restores fullscreen control focus when Escape returns to the framed viewport", () => {
    initialize();
    fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Enter fullscreen" })).toHaveFocus();
  });

  it("handles Escape inside a focused iframe and uses the latest back callback", () => {
    const oldBack = vi.fn(), newBack = vi.fn();
    const result = render(<Chamber app={app()} onBack={oldBack} clock={clock} />);
    fireEvent.click(screen.getByRole("button", { name: "Initialize" }));
    const iframe = screen.getByTitle("Reliability") as HTMLIFrameElement;
    fireEvent.load(iframe);
    fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));
    result.rerender(<Chamber app={app()} onBack={newBack} clock={clock} />);
    fireEvent.keyDown(iframe.contentWindow!, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Enter fullscreen" })).toHaveFocus();
    fireEvent.keyDown(iframe.contentWindow!, { key: "Escape" });
    expect(newBack).toHaveBeenCalledTimes(1);
    expect(oldBack).not.toHaveBeenCalled();
  });

  it("verifies Escape bridge messages before applying layered dismissal", () => {
    const { iframe } = initialize();
    fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));
    post(iframe, { type: "CHAMBER_ESCAPE", extra: true });
    expect(screen.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
    post(iframe, { type: "CHAMBER_ESCAPE" });
    expect(screen.getByRole("button", { name: "Enter fullscreen" })).toBeVisible();
  });

  it("removes injected iframe keyboard listeners during session teardown", () => {
    const { iframe, unmount } = initialize();
    fireEvent.load(iframe);
    const remove = vi.spyOn(iframe.contentWindow!, "removeEventListener");
    unmount();
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("keeps log visibility control relationships valid while the log is hidden", () => {
    initialize();
    const toggle = screen.getByRole("button", { name: "Hide logs" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).not.toBeNull();
  });
});


describe("Packaged Chamber assets", () => {
  it("resolves catalog paths inside the installation and confines file image previews", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "file:///opt/Catalog/dist/index.html",
    });
    vi.stubGlobal("window", dom.window);
    vi.stubGlobal("document", dom.window.document);
    vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
    const result = render(<Chamber app={app()} onBack={vi.fn()} clock={clock} />);
    try {
      const view = within(result.container);
      fireEvent.click(view.getByRole("button", { name: "Initialize" }));
      const iframe = view.getByTitle("Reliability") as HTMLIFrameElement;
      expect(iframe).toHaveAttribute("src", "file:///opt/Catalog/dist/artifact.html");
      const send = (src: string) => act(() => dom.window.dispatchEvent(new dom.window.MessageEvent("message", {
        source: iframe.contentWindow, origin: "null", data: { type: "IMAGE_CLICKED", src },
      })));
      send("file:///etc/private.png");
      send("file:///opt/Catalog/dist/images/..%2F..%2Fprivate.png");
      expect(view.queryByRole("dialog")).toBeNull();
      send("file:///opt/Catalog/dist/images/asset.png");
      expect(view.getByRole("dialog")).toBeVisible();
    } finally {
      result.unmount();
      vi.unstubAllGlobals();
      dom.window.close();
    }
  });
});
