import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Catalog, CatalogCard } from "../Catalog";
import { CATALOG_ENTRIES, type AppEntry } from "../data";
import { DEFAULT_TAG } from "../lib/constants";
import { buildCatalogSearchIndex, filterCatalogEntries, normalizeCatalogSearch } from "../lib/catalog";
import { setReducedMotion } from "./matchMedia";

const auth = vi.hoisted(() => ({
  user: null as { email: string } | null,
  profile: null as { username: string; created_at: string } | null,
  loading: false,
  signOut: vi.fn<() => Promise<void>>(),
  showAuthModal: vi.fn(),
}));
vi.mock("../lib/auth", () => ({ useAuth: () => auth, useAuthModal: () => ({ showAuthModal: auth.showAuthModal }) }));

const fixture: AppEntry = {
  id: "cafe-terminal",
  title: "CAFÉ TERMINAL",
  description: "A quiet interface.",
  longDescription: "Hidden transmission analysis notes.",
  tags: ["Tool", "Interactive"],
  tech: ["HTML"],
  image: "/images/terminal.svg",
  url: "/terminal.html",
};

function renderCatalog(overrides: Partial<React.ComponentProps<typeof Catalog>> = {}) {
  const props = { onSelectApp: vi.fn(), searchQuery: "", onSearchChange: vi.fn(), selectedTag: DEFAULT_TAG as string, onTagSelect: vi.fn(), ...overrides };
  return { ...render(<Catalog {...props} />), props };
}

beforeEach(() => {
  auth.user = null;
  auth.profile = null;
  auth.signOut.mockReset().mockResolvedValue(undefined);
  auth.showAuthModal.mockClear();
  setReducedMotion(false);
});
afterEach(() => {
  cleanup();
  setReducedMotion(false);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("catalog search index", () => {
  it("finds independent words across title, categories and implementation stack", () => {
    const index = buildCatalogSearchIndex([fixture]);
    expect(filterCatalogEntries(index, "html cafe tool")).toHaveLength(1);
    expect(filterCatalogEntries(index, "cafe missing")).toHaveLength(0);
  });
  it("finds classified notes and normalizes repeated whitespace", () => {
    expect(filterCatalogEntries(buildCatalogSearchIndex([fixture]), "  hidden \t transmission\n")).toHaveLength(1);
    expect(normalizeCatalogSearch("CAFÉ ‘TERMINAL’ — NOTES")).toBe("cafe 'terminal' - notes");
  });
  it("handles inherited object keys as unknown categories", () => {
    expect(filterCatalogEntries(buildCatalogSearchIndex([fixture]), "", "__proto__")).toEqual([]);
    expect(filterCatalogEntries(buildCatalogSearchIndex([fixture]), "", "constructor")).toEqual([]);
    renderCatalog({ selectedTag: "__proto__" });
    expect(screen.getByText(/Nothing found/)).toBeInTheDocument();
  });
  it("does not double-index duplicate categories or mutate caller records", () => {
    const duplicate = { ...fixture, tags: ["Tool", "Tool"] };
    const index = buildCatalogSearchIndex([duplicate]);
    expect(index.byTag.get("Tool")).toHaveLength(1);
    expect(duplicate).not.toHaveProperty("searchBlob");
  });
});

describe("catalog accessibility and shortcuts", () => {
  it("connects category counts and search controls to the results region", () => {
    renderCatalog({ searchQuery: "warren" });
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("aria-controls", "catalog-results");
    expect(input).toHaveAttribute("aria-keyshortcuts", "/");
    const count = CATALOG_ENTRIES.filter((entry) => filterCatalogEntries(buildCatalogSearchIndex([entry]), "warren").length).length;
    expect(screen.getByRole("button", { name: DEFAULT_TAG })).toHaveAccessibleDescription(`${count} matching entries`);
    expect(screen.getByRole("main")).toHaveAccessibleName("The Archive");
    expect(screen.getByRole("group", { name: "Catalog categories" })).toBeInTheDocument();
  });
  it("gives cards a title and activation description without nested buttons", () => {
    renderCatalog();
    const entry = CATALOG_ENTRIES.find((candidate) => !candidate.requiresAuth && !candidate.missing)!;
    const card = screen.getByRole("article", { name: entry.title });
    expect(within(card).getByRole("button", { name: `Open ${entry.title}` })).toHaveAccessibleDescription(entry.description);
    expect(card.querySelectorAll("button button")).toHaveLength(0);
  });
  it("preserves modified and pre-consumed Escape events", () => {
    const { props } = renderCatalog({ searchQuery: "warren" });
    fireEvent.keyDown(window, { key: "Escape", ctrlKey: true });
    const consumed = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    consumed.preventDefault();
    window.dispatchEvent(consumed);
    expect(props.onSearchChange).not.toHaveBeenCalled();
  });
  it("does not steal shortcuts from select fields or nested editable text", () => {
    renderCatalog();
    const select = document.createElement("select");
    const editor = document.createElement("div");
    editor.contentEditable = "true";
    editor.setAttribute("contenteditable", "true");
    const nested = document.createElement("span");
    editor.append(nested);
    document.body.append(select, editor);
    fireEvent.keyDown(select, { key: "/" });
    fireEvent.keyDown(nested, { key: "/" });
    expect(screen.getByRole("searchbox")).not.toHaveFocus();
    select.remove();
    editor.remove();
  });
  it("protects an open modal even before focus enters it", () => {
    const { props } = renderCatalog({ searchQuery: "warren" });
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.append(dialog);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "/" });
    expect(props.onSearchChange).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox")).not.toHaveFocus();
    dialog.remove();
  });
  it("lets Escape reset the catalog search while retaining its keyboard focus", () => {
    const { props } = renderCatalog({ searchQuery: "warren" });
    const search = screen.getByRole("searchbox");
    search.focus();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(props.onSearchChange).toHaveBeenCalledWith("");
    expect(props.onTagSelect).toHaveBeenCalledWith(DEFAULT_TAG);
    expect(search).toHaveFocus();
  });
});

describe("catalog image and identity recovery", () => {
  it("retries a corrected card preview when the entry ID stays the same", () => {
    const props = { entry: fixture, onSelect: vi.fn(), onTagSelect: vi.fn(), isUserLoggedIn: false };
    const { rerender } = render(<CatalogCard {...props} />);
    fireEvent.error(document.querySelector("img")!);
    expect(document.querySelector("img")).toBeNull();
    rerender(<CatalogCard {...props} entry={{ ...fixture, image: "/images/corrected.svg" }} />);
    expect(document.querySelector("img")).toHaveAttribute("src", "/images/corrected.svg");
    expect(screen.getByRole("button", { name: `Open ${fixture.title}` })).toBeEnabled();
    rerender(<CatalogCard {...props} />);
    expect(document.querySelector("img")).toHaveAttribute("src", fixture.image);
  });
  it("ignores old card image errors after a same-ID source replacement", () => {
    const props = { entry: fixture, onSelect: vi.fn(), onTagSelect: vi.fn(), isUserLoggedIn: false };
    const { rerender } = render(<CatalogCard {...props} />);
    const oldImage = document.querySelector("img")!;
    rerender(<CatalogCard {...props} entry={{ ...fixture, image: "/images/corrected.svg" }} />);
    fireEvent.error(oldImage);
    const corrected = document.querySelector("img")!;
    expect(corrected).toHaveAttribute("src", "/images/corrected.svg");
    fireEvent.error(corrected);
    fireEvent.load(oldImage);
    expect(document.querySelector("img")).toBeNull();
  });
  it("loads catalog thumbnails beside a packaged Electron entry point", () => {
    vi.spyOn(document, "baseURI", "get").mockReturnValue("file:///opt/catalog/dist/index.html");
    renderCatalog();
    const entry = CATALOG_ENTRIES.find((candidate) => !candidate.requiresAuth && !candidate.missing)!;
    expect(screen.getByRole("article", { name: entry.title }).querySelector("img"))
      .toHaveAttribute("src", `file:///opt/catalog/dist${entry.image}`);
  });
  it("replaces a failed thumbnail while preserving the entry action", () => {
    renderCatalog();
    const entry = CATALOG_ENTRIES.find((candidate) => !candidate.requiresAuth && !candidate.missing)!;
    const card = screen.getByRole("article", { name: entry.title });
    fireEvent.error(card.querySelector("img")!);
    expect(card.querySelector("img")).toBeNull();
    expect(within(card).getByRole("button", { name: `Open ${entry.title}` })).toBeEnabled();
  });
  it("honors reduced motion for JavaScript thumbnail transforms", () => {
    setReducedMotion(true);
    renderCatalog();
    const entry = CATALOG_ENTRIES.find((candidate) => !candidate.requiresAuth && !candidate.missing)!;
    const card = screen.getByRole("article", { name: entry.title });
    const image = card.querySelector("img")!;
    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    expect(image.style.transform).toBe("");
  });
  it("stops a queued thumbnail transform if reduced motion is enabled during hover", () => {
    let scheduled: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { scheduled = callback; return 18; });
    renderCatalog();
    const entry = CATALOG_ENTRIES.find((candidate) => !candidate.requiresAuth && !candidate.missing)!;
    const card = screen.getByRole("article", { name: entry.title });
    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 20, clientY: 20 });
    setReducedMotion(true);
    act(() => scheduled?.(0));
    expect(card.querySelector("img")!.style.transform).toBe("");
  });
  it("batches pointer movement into one frame and cancels the frame on leave", () => {
    let scheduled: FrameRequestCallback | undefined;
    const request = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { scheduled = callback; return 17; });
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    renderCatalog();
    const entry = CATALOG_ENTRIES.find((candidate) => !candidate.requiresAuth && !candidate.missing)!;
    const card = screen.getByRole("article", { name: entry.title });
    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(card, { clientX: 30, clientY: 30 });
    expect(request).toHaveBeenCalledTimes(1);
    act(() => scheduled?.(0));
    expect(card.querySelector("img")!.style.transform).toContain("translate(1.5px, 1.5px)");
    fireEvent.mouseMove(card, { clientX: 40, clientY: 40 });
    fireEvent.mouseLeave(card);
    expect(cancel).toHaveBeenCalledWith(17);
    expect(card.querySelector("img")!.style.transform).toBe("");
  });
  it("recovers from a failed sign-out and trims a blank profile username", async () => {
    auth.user = { email: "observer@example.com" };
    auth.profile = { username: "  ", created_at: "invalid" };
    auth.signOut.mockRejectedValueOnce(new Error("offline"));
    renderCatalog();
    expect(within(screen.getByRole("complementary", { name: "Archive controls" })).getByText("observer")).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Cease Existence" })));
    expect(screen.getByRole("alert")).toHaveTextContent("Sign-out failed");
    expect(screen.getByRole("button", { name: "Cease Existence" })).toBeEnabled();
  });
  it("prevents duplicate sign-out requests while the first request is pending", async () => {
    auth.user = { email: "observer@example.com" };
    let resolveSignOut: (() => void) | undefined;
    auth.signOut.mockImplementation(() => new Promise<void>((resolve) => { resolveSignOut = resolve; }));
    renderCatalog();
    const button = screen.getByRole("button", { name: "Cease Existence" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    await act(async () => resolveSignOut?.());
    expect(screen.getByRole("button", { name: "Cease Existence" })).toBeEnabled();
  });
});
