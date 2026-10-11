import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProductPage } from "../ProductPage";
import type { AppEntry } from "../data";
import { setReducedMotion } from "./matchMedia";

const app: AppEntry = {
  id: "reliable-entry",
  title: "Reliable Entry",
  description: "A clear product description.",
  image: "/images/reliable.svg",
  url: "/reliable.html",
  size: "12 KB",
  version: "v.1.0",
  tech: ["HTML"],
};
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}
function renderProduct(overrides: Partial<React.ComponentProps<typeof ProductPage>> = {}) {
  const props = { app, onBack: vi.fn(), onEnter: vi.fn(), onTagSelect: vi.fn(), ...overrides };
  return { ...render(<ProductPage {...props} />), props };
}

beforeEach(() => {
  vi.useFakeTimers();
  setReducedMotion(false);
  setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
});
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  setReducedMotion(false);
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("product clipboard lifecycle", () => {
  it("blocks overlapping clipboard writes and exposes the pending state", async () => {
    let resolveCopy: (() => void) | undefined;
    const writeText = vi.fn(() => new Promise<void>((resolve) => { resolveCopy = resolve; }));
    setClipboard({ writeText });
    renderProduct();
    const copy = screen.getByRole("button", { name: "Copy entry ID" });
    fireEvent.click(copy);
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(copy).toBeDisabled();
    expect(copy).toHaveAttribute("aria-busy", "true");
    await act(async () => resolveCopy?.());
    expect(copy).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent(`${app.id} is on the clipboard`);
  });

  it("does not attribute a completed write to a different selected product", async () => {
    let resolveCopy: (() => void) | undefined;
    setClipboard({ writeText: vi.fn(() => new Promise<void>((resolve) => { resolveCopy = resolve; })) });
    const { rerender, props } = renderProduct();
    fireEvent.click(screen.getByRole("button", { name: "Copy entry ID" }));
    rerender(<ProductPage {...props} app={{ ...app, id: "next-entry", title: "Next Entry" }} />);
    await act(async () => resolveCopy?.());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: "Copy entry ID" })).toBeEnabled();
    expect(screen.queryByText("COPIED")).not.toBeInTheDocument();
  });

  it("clears success styling before a later clipboard failure", async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));
    setClipboard({ writeText });
    renderProduct();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy entry ID" })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "ID copied" })));
    expect(screen.getByRole("status")).toHaveTextContent("Copy failed");
    expect(screen.getByRole("button", { name: "Copy entry ID" })).toBeEnabled();
    expect(screen.queryByText("COPIED")).not.toBeInTheDocument();
  });

  it("keeps the ID selectable when the clipboard API is unavailable", () => {
    setClipboard(undefined);
    renderProduct();
    fireEvent.click(screen.getByRole("button", { name: "Copy entry ID" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copy unavailable");
    expect(document.querySelector("code")).toHaveTextContent(app.id);
    expect(document.querySelector("code")).toHaveClass("select-all");
  });

  it("cleans both reveal and status timers when the view is removed", async () => {
    const { unmount } = renderProduct();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy entry ID" })));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("product navigation and content", () => {
  it("retries both product previews after a corrected source with the same entry ID", () => {
    const { rerender, props } = renderProduct();
    fireEvent.error(document.querySelector("img")!);
    expect(document.querySelectorAll("img")).toHaveLength(0);
    rerender(<ProductPage {...props} app={{ ...app, image: "/images/corrected.svg" }} />);
    const images = document.querySelectorAll("img");
    expect(images).toHaveLength(2);
    for (const image of images) expect(image).toHaveAttribute("src", "/images/corrected.svg");
    rerender(<ProductPage {...props} />);
    expect(document.querySelectorAll("img")).toHaveLength(2);
    for (const image of document.querySelectorAll("img")) expect(image).toHaveAttribute("src", app.image);
  });
  it("ignores obsolete product image errors and loads after replacing their source", () => {
    const { rerender, props } = renderProduct();
    const oldImages = document.querySelectorAll("img");
    rerender(<ProductPage {...props} app={{ ...app, image: "/images/corrected.svg" }} />);
    for (const image of oldImages) fireEvent.error(image);
    const currentImages = document.querySelectorAll("img");
    expect(currentImages).toHaveLength(2);
    for (const image of currentImages) expect(image).toHaveAttribute("src", "/images/corrected.svg");
    fireEvent.error(currentImages[0]);
    for (const image of oldImages) fireEvent.load(image);
    expect(document.querySelectorAll("img")).toHaveLength(0);
  });
  it("loads both product hero variants from the packaged asset directory", () => {
    vi.spyOn(document, "baseURI", "get").mockReturnValue("file:///opt/catalog/dist/index.html");
    renderProduct();
    const images = document.querySelectorAll("img");
    expect(images).toHaveLength(2);
    for (const image of images) expect(image).toHaveAttribute("src", `file:///opt/catalog/dist${app.image}`);
  });
  it("does not handle an Escape reserved by a modal, modifier or composing input", () => {
    const { props } = renderProduct();
    fireEvent.keyDown(window, { key: "Escape", ctrlKey: true });
    fireEvent.keyDown(window, { key: "Escape", isComposing: true });
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.append(modal);
    fireEvent.keyDown(window, { key: "Escape" });
    modal.remove();
    expect(props.onBack).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onBack).toHaveBeenCalledOnce();
  });

  it("honors a default-prevented Escape and editor keyboard handling", () => {
    const { props } = renderProduct();
    const consumed = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    consumed.preventDefault();
    window.dispatchEvent(consumed);
    const editor = document.createElement("textarea");
    document.body.append(editor);
    fireEvent.keyDown(editor, { key: "Escape" });
    editor.remove();
    expect(props.onBack).not.toHaveBeenCalled();
  });

  it.each([{ missing: true }, { url: undefined }, { url: "javascript:alert(1)" }])("prevents unavailable entries from entering a chamber: %j", (overrides) => {
    const { props } = renderProduct({ app: { ...app, ...overrides } });
    const enter = screen.getByRole("button", { name: "Entry unavailable" });
    expect(enter).toBeDisabled();
    fireEvent.click(enter);
    expect(props.onEnter).not.toHaveBeenCalled();
  });

  it("splits Windows paragraphs, removes whitespace-only paragraphs and preserves repeated text", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    renderProduct({ app: { ...app, longDescription: "\r\n \r\n A repeated paragraph.\r\n\r\nA repeated paragraph.\r\n \r\n" } });
    expect(screen.getAllByText("A repeated paragraph.")).toHaveLength(2);
    expect(error.mock.calls.flat().join(" ")).not.toMatch(/same key|unique.*key/i);
  });

  it("identifies the main view and associates manifest values with their labels", () => {
    renderProduct({ app: { ...app, temp: "12 °C", queue: "3" } });
    expect(screen.getByRole("main")).toHaveAccessibleName(app.title);
    const manifest = screen.getByRole("region", { name: "TECH_MANIFEST //" });
    expect(manifest.querySelectorAll("dt")).toHaveLength(5);
    expect(manifest.querySelectorAll("dd")).toHaveLength(5);
    expect(screen.getByText("Temperature").nextElementSibling).toHaveTextContent("12 °C");
  });

  it("omits an empty technical manifest", () => {
    renderProduct({ app: { ...app, size: undefined, version: undefined, tech: undefined } });
    expect(screen.queryByText("TECH_MANIFEST //")).not.toBeInTheDocument();
  });

  it("removes broken hero images without hiding product information", () => {
    renderProduct();
    fireEvent.error(document.querySelector("img")!);
    expect(document.querySelectorAll("img")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(app.title);
    expect(screen.getByRole("button", { name: "Enter Chamber" })).toBeEnabled();
  });

  it("avoids the reveal delay when reduced motion is requested", () => {
    setReducedMotion(true);
    const { container } = renderProduct();
    act(() => vi.advanceTimersByTime(0));
    expect(container.querySelector(".transition-all.duration-700")).toHaveClass("opacity-100");
  });
});
