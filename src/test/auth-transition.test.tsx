/**
 * Regression: `UserSection` used to call three `useMemo` hooks *after* its
 * `loading` / `!user` early returns. Signed out it ran 3 hooks; the moment a
 * session arrived it ran 6, and React aborted the render with "Rendered more
 * hooks than during the previous render" — blanking the whole catalog on every
 * successful sign-in.
 *
 * `tsc` cannot see this. `react-hooks/rules-of-hooks` can, and so can this test.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  listeners: new Set<(event: string, session: unknown) => void>(),
  profileRows: new Map<string, unknown>(),
}));

vi.mock("../lib/supabase", () => {
  const chain = (result: unknown) => ({
    eq: () => ({ select: () => ({ maybeSingle: async () => result }) }),
    select: () => ({ single: async () => result, maybeSingle: async () => result }),
    single: async () => result,
  });

  return {
    supabaseAvailable: true,
    supabase: {
      auth: {
        onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
          mocks.listeners.add(cb);
          cb("INITIAL_SESSION", null);
          return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(cb) } } };
        },
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        update: () => chain({ data: null }),
        insert: () => chain({ data: null, error: null }),
      }),
    },
  };
});

// Imported after the mock is registered so `auth.tsx` picks up the fake client.
const { Catalog } = await import("../Catalog");
const { AuthProvider } = await import("../lib/auth");

function emitSession(session: unknown) {
  for (const cb of mocks.listeners) cb("SIGNED_IN", session);
}

afterEach(() => cleanup());

describe("UserSection — hooks order across the auth transition", () => {
  it("renders the signed-out identity block", async () => {
    render(
      <AuthProvider>
        <Catalog
          onSelectApp={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
          selectedTag="All_Entries"
          onTagSelect={() => {}}
        />
      </AuthProvider>,
    );
    expect(await screen.findByText("Identify Yourself")).toBeInTheDocument();
    expect(screen.getByText("Anonymous Entity")).toBeInTheDocument();
  });

  it("survives the signed-out → signed-in transition that used to crash", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AuthProvider>
        <Catalog
          onSelectApp={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
          selectedTag="All_Entries"
          onTagSelect={() => {}}
        />
      </AuthProvider>,
    );

    await screen.findByText("Identify Yourself");

    // Before the fix this act() threw "Rendered more hooks than during the
    // previous render" and React unmounted the tree.
    act(() => {
      emitSession({ user: { id: "u-1", email: "wanderer@void.test" } });
    });

    await waitFor(() => expect(screen.getByText("Observer")).toBeInTheDocument());
    // Avatar initials derived from the email local-part.
    expect(screen.getByText("WA")).toBeInTheDocument();
    expect(screen.getByText("Cease Existence")).toBeInTheDocument();

    const hookCrash = consoleError.mock.calls.flat().join(" ");
    expect(hookCrash).not.toMatch(/Rendered more hooks/);
    consoleError.mockRestore();
  });
});
