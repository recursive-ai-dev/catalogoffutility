import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), signUp: vi.fn(), close: vi.fn(), connectionError: null as string | null,
}));
vi.mock("../lib/auth", () => ({
  useAuth: () => ({ signIn: mocks.signIn, signUp: mocks.signUp, connectionError: mocks.connectionError }),
  useAuthModal: () => ({ hideAuthModal: mocks.close }),
}));
vi.mock("../lib/supabase", () => ({ supabaseAvailable: true }));
import { AuthModal } from "../AuthModal";

function fill(password = "secret") {
  fireEvent.change(screen.getByLabelText("Designation"), { target: { value: "observer@example.com" } });
  fireEvent.change(screen.getByLabelText("Passphrase"), { target: { value: password } });
}
function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector("form")!);
}

beforeEach(() => {
  mocks.signIn.mockReset().mockResolvedValue({ error: null });
  mocks.signUp.mockReset().mockResolvedValue({ error: null, needsConfirmation: true });
  mocks.close.mockReset();
  mocks.connectionError = null;
});
afterEach(() => { cleanup(); document.body.style.overflow = ""; });

describe("authentication dialog request lifecycle", () => {
  it("prevents duplicate submissions and freezes credentials and mode during a request", async () => {
    let resolve!: (value: { error: null }) => void;
    mocks.signIn.mockReturnValue(new Promise((settle) => { resolve = settle; }));
    const view = render(<AuthModal />); fill();
    submit(view.container); submit(view.container);
    expect(mocks.signIn).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Designation")).toBeDisabled();
    expect(screen.getByLabelText("Passphrase")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Register existence" })).toBeDisabled();
    await act(async () => { resolve({ error: null }); });
  });

  it("catches an unexpected rejection and makes the form usable again", async () => {
    mocks.signIn.mockRejectedValue(new Error("sensitive connection details"));
    const view = render(<AuthModal />); fill(); submit(view.container);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Please try again"));
    expect(screen.getByLabelText("Passphrase")).toBeEnabled();
    expect(screen.getByRole("alert")).not.toHaveTextContent("sensitive");
  });

  it("does not close a later dialog when a request resolves after this one was dismissed", async () => {
    let resolve!: (value: { error: null }) => void;
    mocks.signIn.mockReturnValue(new Promise((settle) => { resolve = settle; }));
    const view = render(<AuthModal />); fill(); submit(view.container);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(mocks.close).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ error: null }); });
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });

  it("allows a previously configured short password during sign-in", async () => {
    const view = render(<AuthModal />); fill("short"); submit(view.container);
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith("observer@example.com", "short"));
  });

  it("enforces signup length without calling the service for an invalid form", () => {
    const view = render(<AuthModal />);
    fireEvent.click(screen.getByRole("button", { name: "Register existence" }));
    fill(""); submit(view.container);
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Passphrase")).toHaveAttribute("minlength", "6");
  });

  it("announces and focuses confirmation after signup", async () => {
    const view = render(<AuthModal />);
    fireEvent.click(screen.getByRole("button", { name: "Register existence" }));
    fill(); submit(view.container);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Inscription received"));
    expect(document.activeElement).toBe(screen.getByRole("status"));
    expect(screen.queryByLabelText("Passphrase")).not.toBeInTheDocument();
  });

  it("keeps a connection warning retryable in the form", () => {
    mocks.connectionError = "Temporary connection failure";
    render(<AuthModal />);
    expect(screen.getByLabelText("Designation")).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Temporary connection failure");
  });

  it("reports rate-limited email requests before the generic email error", async () => {
    mocks.signIn.mockResolvedValue({ error: "email rate limit exceeded" });
    const view = render(<AuthModal />); fill(); submit(view.container);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Too many attempts"));
  });

  it("describes unconfirmed email accurately instead of calling it malformed", async () => {
    mocks.signIn.mockResolvedValue({ error: "Email not confirmed" });
    const view = render(<AuthModal />); fill(); submit(view.container);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("confirm your email"));
  });

  it("connects an auth error to the fields and clears it when credentials change", async () => {
    mocks.signIn.mockResolvedValue({ error: "invalid credentials" });
    const view = render(<AuthModal />); fill(); submit(view.container);
    await waitFor(() => expect(screen.getByLabelText("Designation")).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByLabelText("Passphrase")).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
    fireEvent.change(screen.getByLabelText("Passphrase"), { target: { value: "new-password" } });
    expect(screen.getByLabelText("Passphrase")).not.toHaveAttribute("aria-invalid");
  });
});

describe("authentication dialog keyboard and focus", () => {
  it("prevents background scrolling and restores its original overflow on close", () => {
    document.body.style.overflow = "auto";
    const view = render(<AuthModal />);
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("contains programmatic focus attempts behind the modal", () => {
    const background = document.createElement("button");
    document.body.appendChild(background);
    const view = render(<AuthModal />);
    background.focus();
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
    view.unmount(); background.remove();
  });

  it("restores the connected opener after unmount", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener); opener.focus();
    const view = render(<AuthModal />); view.unmount();
    expect(document.activeElement).toBe(opener); opener.remove();
  });

  it("ignores Escape during input-method composition", () => {
    render(<AuthModal />);
    fireEvent.keyDown(screen.getByLabelText("Designation"), { key: "Escape", isComposing: true });
    expect(mocks.close).not.toHaveBeenCalled();
  });

  it("handles Escape locally so outer keyboard handlers do not also run", () => {
    const handler = vi.fn();
    window.addEventListener("keydown", handler);
    render(<AuthModal />);
    fireEvent.keyDown(screen.getByLabelText("Designation"), { key: "Escape" });
    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener("keydown", handler);
  });

  it("gives the dialog a description and email entry stable password-manager metadata", () => {
    render(<AuthModal />);
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("The archive demands verification of continued existence.");
    expect(screen.getByLabelText("Designation")).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("Designation")).toHaveAttribute("autocapitalize", "none");
    expect(screen.getByLabelText("Passphrase")).toHaveAttribute("name", "password");
  });
});
