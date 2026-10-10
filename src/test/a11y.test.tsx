/**
 * Accessibility regression tests for the changes made in the polish pass.
 *
 * Each test names the defect it guards: the previous markup either failed a
 * WCAG 2.1 AA criterion listed in docs/ux-foundation.md §8, or produced
 * behaviour a keyboard/screen-reader user could not perceive.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import { Chamber } from "../Chamber";
import { Catalog } from "../Catalog";
import { CATALOG_ENTRIES, AppEntry } from "../data";
import { AuthProvider } from "../lib/auth";

const makeApp = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: "test-app",
  title: "TEST APP",
  description: "A test description",
  image: "https://example.com/img.jpg",
  url: "/test-app.html",
  tags: ["Narrative"],
  tech: ["HTML"],
  version: "v.1.0",
  size: "10 KB",
  ...overrides,
});

const openEntry = CATALOG_ENTRIES.find((e) => !e.missing && !e.requiresAuth)!;

function renderCatalog() {
  return render(
    <AuthProvider>
      <Catalog
        onSelectApp={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedTag="All_Entries"
        onTagSelect={vi.fn()}
      />
    </AuthProvider>,
  );
}

function renderInitializedChamber(onBack = vi.fn()) {
  render(<Chamber app={makeApp()} onBack={onBack} />);
  fireEvent.click(screen.getByText("Initialize"));
  return onBack;
}

afterEach(() => cleanup());

describe("Catalog cards — no nested interactive controls", () => {
  /**
   * The card used to be a `div role="button"` containing the tag filter buttons.
   * A button inside a button-role element is invalid (WCAG 4.1.2) and screen
   * readers expose the whole card as a single control, hiding the tag buttons.
   */
  it("contains no interactive element inside a role=button container", () => {
    renderCatalog();
    expect(document.querySelectorAll('[role="button"] button').length).toBe(0);
    expect(document.querySelectorAll('[role="button"]').length).toBe(0);
  });

  it("exposes each card as a labelled activation button", () => {
    renderCatalog();
    expect(screen.getByRole("button", { name: `Open ${openEntry.title}` })).toBeInTheDocument();
  });

  it("labels auth-gated cards as restricted rather than as disabled", () => {
    renderCatalog();
    const locked = CATALOG_ENTRIES.find((e) => e.requiresAuth)!;
    const btn = screen.getByRole("button", { name: `${locked.title} — authentication required` });
    // It IS activatable — it opens the auth modal — so it must not be announced
    // as disabled.
    expect(btn).not.toHaveAttribute("aria-disabled", "true");
  });

  it("declares intrinsic thumbnail dimensions to avoid layout shift", () => {
    renderCatalog();
    const img = document.querySelector("img") as HTMLImageElement;
    expect(img).toHaveAttribute("width", "800");
    expect(img).toHaveAttribute("height", "600");
    expect(img).toHaveAttribute("loading", "lazy");
    // The title is already the adjacent heading, so the thumbnail is decorative.
    expect(img).toHaveAttribute("alt", "");
  });

  it("marks the search input as a search landmark and the count as a live region", () => {
    renderCatalog();
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Entries/);
  });
});

describe("Chamber — perceivable controls", () => {
  it("exposes the log panel as a live log region", () => {
    renderInitializedChamber();
    expect(screen.getByRole("log")).toBeInTheDocument();
  });

  it("gives the fullscreen toggle a name and a pressed state", () => {
    renderInitializedChamber();
    const btn = screen.getByRole("button", { name: /fullscreen/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /fullscreen/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /**
   * Escape previously navigated out of the Chamber even in fullscreen, throwing
   * away the session instead of returning to the framed view.
   */
  it("Escape exits fullscreen before it abandons the view", () => {
    const onBack = renderInitializedChamber();
    fireEvent.click(screen.getByRole("button", { name: /enter fullscreen/i }));
    expect(screen.getByRole("button", { name: /exit fullscreen/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onBack).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /enter fullscreen/i })).toBeInTheDocument();
  });

  it("a second Escape then returns to the product page", () => {
    const onBack = renderInitializedChamber();
    fireEvent.click(screen.getByRole("button", { name: /enter fullscreen/i }));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("keeps the noise toggle reachable on small viewports", () => {
    renderInitializedChamber();
    const noise = screen.getByRole("button", { name: /noise overlay/i });
    // It was `hidden md:flex`, i.e. not present at all on phones.
    expect(noise.className).not.toContain("hidden md:flex");
    expect(noise).toHaveAttribute("aria-pressed", "true");
  });

  it("does not leak the parent URL as a referrer to the embedded app", () => {
    renderInitializedChamber();
    expect(screen.getByTitle("TEST APP")).toHaveAttribute("referrerPolicy", "no-referrer");
  });

  it("renders the debugging guide as a button, not a dead anchor", () => {
    render(<Chamber app={makeApp()} onBack={vi.fn()} initialError="load failed" />);
    const guide = screen.getByRole("button", { name: /View Debugging Guide/i });
    expect(guide.tagName).toBe("BUTTON");
    expect(document.querySelectorAll('a[href="#"]').length).toBe(0);
  });
});

describe("Chamber — asset viewer focus management", () => {
  async function openAssetViewer() {
    const onBack = renderInitializedChamber();
    const iframe = screen.getByTitle("TEST APP") as HTMLIFrameElement;
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "IMAGE_CLICKED", src: "https://example.com/img.jpg" },
          origin: window.location.origin,
          source: iframe.contentWindow,
        }),
      );
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    return onBack;
  }

  it("moves focus into the dialog when it opens", async () => {
    await openAssetViewer();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Close image viewer/i }));
  });

  it("traps Tab inside the dialog", async () => {
    await openAssetViewer();
    const dialog = screen.getByRole("dialog");
    // Only the close button is focusable inside the panel, so Tab must wrap to it.
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Close image viewer/i }));
  });

  it("returns focus to the element that held it before the dialog opened", async () => {
    const onBack = renderInitializedChamber();
    const opener = screen.getByRole("button", { name: /enter fullscreen/i });
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const iframe = screen.getByTitle("TEST APP") as HTMLIFrameElement;
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "IMAGE_CLICKED", src: "https://example.com/img.jpg" },
          origin: window.location.origin,
          source: iframe.contentWindow,
        }),
      );
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Close image viewer/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Focus is handed back rather than dropped on <body>.
    expect(document.activeElement).toBe(opener);
    expect(onBack).not.toHaveBeenCalled();
  });
});
