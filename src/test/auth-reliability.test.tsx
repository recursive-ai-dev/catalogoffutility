import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { StrictMode, useState } from "react";

const mocks = vi.hoisted(() => ({
  listeners: new Set<(event: string, session: Session | null) => void>(),
  update: vi.fn(),
  insert: vi.fn(),
  read: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  subscriptionThrows: false,
  emitInitial: true,
  initialSession: null as Session | null,
}));

vi.mock("../lib/supabase", () => ({
  supabaseAvailable: true,
  supabase: {
    auth: {
      onAuthStateChange: (listener: (event: string, session: Session | null) => void) => {
        if (mocks.subscriptionThrows) throw new Error("secret infrastructure details");
        mocks.listeners.add(listener);
        if (mocks.emitInitial) listener("INITIAL_SESSION", mocks.initialSession);
        return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
      },
      signInWithPassword: mocks.signIn,
      signUp: mocks.signUp,
      signOut: mocks.signOut,
    },
    from: () => ({
      update: () => ({ eq: (_column: string, id: string) => ({ select: () => ({ maybeSingle: () => mocks.update(id) }) }) }),
      insert: (values: unknown) => ({ select: () => ({ single: () => mocks.insert(values) }) }),
      select: () => ({ eq: (_column: string, id: string) => ({ maybeSingle: () => mocks.read(id) }) }),
    }),
  },
}));

import { AuthProvider, useAuth } from "../lib/auth";

function Probe() {
  const { user, profile, connectionError, loading, signIn, signUp, signOut } = useAuth();
  const [result, setResult] = useState("");
  return <>
    <output data-testid="identity">{user?.id ?? "none"}</output>
    <output data-testid="profile">{profile?.username ?? "none"}</output>
    <output data-testid="connection">{connectionError ?? "none"}</output>
    <output data-testid="loading">{String(loading)}</output>
    <output data-testid="result">{result}</output>
    <button onClick={() => { void signIn("  observer@example.com  ", "secret").then((value) => setResult(JSON.stringify(value))); }}>Sign in</button>
    <button onClick={() => { void signUp("  observer@example.com  ", "secret").then((value) => setResult(JSON.stringify(value))); }}>Sign up</button>
    <button onClick={() => { void signIn(" ", "").then((value) => setResult(JSON.stringify(value))); }}>Empty sign in</button>
    <button onClick={() => { void signOut().catch(() => {}); }}>Sign out</button>
  </>;
}

function mount() { return render(<AuthProvider><Probe /></AuthProvider>); }
function session(id: string, email = `${id}@example.com`): Session {
  return { user: { id, email } } as Session;
}
function emit(value: Session | null, event = "SIGNED_IN") {
  act(() => { mocks.listeners.forEach((listener) => listener(event, value)); });
}
function row(id: string, username = id) {
  return { id, username, created_at: "2026-01-01", last_seen_at: "2026-01-01" };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => { resolve = settle; });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.listeners.clear();
  mocks.subscriptionThrows = false;
  mocks.emitInitial = true;
  mocks.initialSession = null;
  mocks.update.mockReset().mockImplementation(async (id: string) => ({ data: row(id), error: null }));
  mocks.insert.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.read.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.signIn.mockReset().mockResolvedValue({ error: null });
  mocks.signUp.mockReset().mockResolvedValue({ data: { user: {}, session: null }, error: null });
  mocks.signOut.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("authentication profile synchronization", () => {
  it("survives Strict Mode resubscription and fetches the restored profile once", async () => {
    mocks.initialSession = session("first");
    render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>);
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("first"));
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.listeners.size).toBe(1);
  });

  it("defers database queries until after the auth callback releases its lock", async () => {
    mount(); emit(session("first"));
    expect(mocks.update).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("first"));
  });

  it("does not repeat profile writes for token refresh or repeated sign-in events", async () => {
    mount(); emit(session("first"));
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("first"));
    emit(session("first"), "TOKEN_REFRESHED");
    emit(session("first"));
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it("clears the former profile immediately when a different account arrives", async () => {
    mount(); emit(session("first"));
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("first"));
    emit(session("second"));
    expect(screen.getByTestId("profile")).toHaveTextContent("none");
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("second"));
  });

  it("ignores a late profile result belonging to the previous account", async () => {
    const first = deferred<{ data: ReturnType<typeof row>; error: null }>();
    mocks.update.mockImplementation((id: string) => id === "first" ? first.promise : Promise.resolve({ data: row(id), error: null }));
    mount(); emit(session("first"));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("first"));
    emit(session("second"));
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("second"));
    await act(async () => { first.resolve({ data: row("first"), error: null }); });
    expect(screen.getByTestId("profile")).toHaveTextContent("second");
  });

  it("does not recreate an identity from a profile that completes after sign-out", async () => {
    const pending = deferred<{ data: ReturnType<typeof row>; error: null }>();
    mocks.update.mockReturnValue(pending.promise);
    mount(); emit(session("first"));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Sign out"));
    await act(async () => { pending.resolve({ data: row("first"), error: null }); });
    expect(screen.getByTestId("identity")).toHaveTextContent("none");
    expect(screen.getByTestId("profile")).toHaveTextContent("none");
  });

  it("does not attempt a profile insert after an update error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.update.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    mount(); emit(session("first"));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(screen.getByTestId("identity")).toHaveTextContent("first");
  });

  it("contains rejected profile requests without losing authentication", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.update.mockRejectedValue(new Error("database unreachable"));
    mount(); emit(session("first"));
    await waitFor(() => expect(warning).toHaveBeenCalled());
    expect(screen.getByTestId("identity")).toHaveTextContent("first");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("recovers a concurrent insert by reading the existing custom username", async () => {
    mocks.update.mockResolvedValue({ data: null, error: null });
    mocks.insert.mockResolvedValue({ data: null, error: { code: "23505" } });
    mocks.read.mockResolvedValue({ data: row("first", "custom-name"), error: null });
    mount(); emit(session("first"));
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("custom-name"));
    expect(mocks.read).toHaveBeenCalledWith("first");
  });

  it("gives an email-less user a nonempty initial username", async () => {
    mocks.update.mockResolvedValue({ data: null, error: null });
    mount(); emit(session("first", ""));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalled());
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ username: "observer-first" }));
  });

  it("rejects a database row belonging to another identity", async () => {
    mocks.update.mockResolvedValue({ data: row("other"), error: null });
    mount(); emit(session("first"));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(screen.getByTestId("profile")).toHaveTextContent("none");
  });

  it("cancels queued profile synchronization and subscription on unmount", async () => {
    const view = mount(); emit(session("first")); view.unmount();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.listeners.size).toBe(0);
  });
});

describe("auth operations recover from failures", () => {
  it("prevents a new sign-in or signup while sign-out is still completing", async () => {
    const pending = deferred<{ error: null }>();
    mocks.signOut.mockReturnValue(pending.promise);
    mount(); emit(session("first"));
    fireEvent.click(screen.getByText("Sign out"));
    fireEvent.click(screen.getByText("Sign in"));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("still completing"));
    fireEvent.click(screen.getByText("Sign up"));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent('"needsConfirmation":false'));
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
    await act(async () => { pending.resolve({ error: null }); });
  });
  it("leaves loading after a stalled initialization and recovers when a session later arrives", async () => {
    vi.useFakeTimers(); mocks.emitInitial = false; mount();
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("connection")).toHaveTextContent("taking longer");
    emit(session("first"));
    expect(screen.getByTestId("connection")).toHaveTextContent("none");
    expect(screen.getByTestId("identity")).toHaveTextContent("first");
  });

  it("trims email addresses at the provider boundary", async () => {
    mount(); fireEvent.click(screen.getByText("Sign in"));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith({ email: "observer@example.com", password: "secret" }));
    fireEvent.click(screen.getByText("Sign up"));
    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith({ email: "observer@example.com", password: "secret" }));
  });

  it("rejects empty credentials without a network request", async () => {
    mount(); fireEvent.click(screen.getByText("Empty sign in"));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("required"));
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("keeps a transient sign-in rejection retryable without a permanent service error", async () => {
    mocks.signIn.mockRejectedValueOnce(new Error("offline"));
    mount(); fireEvent.click(screen.getByText("Sign in"));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent("Please try again"));
    expect(screen.getByTestId("connection")).toHaveTextContent("none");
    fireEvent.click(screen.getByText("Sign in"));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent('{"error":null}'));
  });

  it("requires a session even if signup returns old confirmation metadata", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { confirmed_at: "2026-01-01" }, session: null }, error: null });
    mount(); fireEvent.click(screen.getByText("Sign up"));
    await waitFor(() => expect(screen.getByTestId("result")).toHaveTextContent('"needsConfirmation":true'));
  });

  it("restores a still-active identity when Supabase returns a sign-out error", async () => {
    mocks.signOut.mockResolvedValue({ error: { message: "offline" } });
    mount(); emit(session("first"));
    await waitFor(() => expect(screen.getByTestId("profile")).toHaveTextContent("first"));
    fireEvent.click(screen.getByText("Sign out"));
    await waitFor(() => expect(screen.getByTestId("connection")).toHaveTextContent("Sign-out could not"));
    expect(screen.getByTestId("identity")).toHaveTextContent("first");
    expect(screen.getByTestId("profile")).toHaveTextContent("first");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("contains subscription setup exceptions without exposing server details", () => {
    mocks.subscriptionThrows = true;
    mount();
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("connection")).toHaveTextContent("connection failed");
    expect(screen.getByTestId("connection")).not.toHaveTextContent("secret");
  });
});
