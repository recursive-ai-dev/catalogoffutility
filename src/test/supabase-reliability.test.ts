import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ createClient: vi.fn(() => ({ auth: {} })) }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
beforeEach(() => {
  vi.resetModules(); mocks.createClient.mockClear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://archive.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-key");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("authentication service configuration", () => {
  it("normalizes whitespace in environment credentials", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "  https://archive.supabase.co  ");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "  public-key  ");
    const module = await import("../lib/supabase");
    expect(module.supabaseAvailable).toBe(true);
    expect(mocks.createClient).toHaveBeenCalledWith("https://archive.supabase.co", "public-key", expect.any(Object));
  });
  it("keeps the archive importable in production with no credentials", async () => {
    vi.stubEnv("PROD", true); vi.stubEnv("VITE_SUPABASE_URL", "");
    const module = await import("../lib/supabase");
    expect(module.supabaseAvailable).toBe(false);
  });
  it.each([
    "not a URL", "javascript:alert(1)", "ftp://archive.supabase.co",
    "https://secret@archive.supabase.co", "https://archive.supabase.co?token=secret", "https://archive.supabase.co#session",
  ])("degrades safely instead of passing an invalid service URL to createClient: %s", async (url) => {
    vi.stubEnv("VITE_SUPABASE_URL", url);
    const module = await import("../lib/supabase");
    expect(module.supabaseAvailable).toBe(false);
    expect(mocks.createClient).toHaveBeenCalledWith("http://localhost:54321", "placeholder-anon-key", expect.any(Object));
  });
  it("does not treat a whitespace-only key as a configured service", async () => {
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", " \n ");
    expect((await import("../lib/supabase")).supabaseAvailable).toBe(false);
  });
  it("disables session storage, background refresh, and URL token detection on the fallback client", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", ""); await import("../lib/supabase");
    expect(mocks.createClient).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });
});
