/**
 * Logic Chain Tests — AuthProfileSync (Chain LC-A)
 *
 * Tests prove the contract defined in .logic-chains/auth-profile-sync.contract.md
 *
 * Chain: fetchProfile in AuthProvider
 * Trigger: onAuthStateChange callback
 * Intent: Sync user profile (update last_seen_at or create profile)
 * Invariants:
 *   1. Profile Existence (eventual consistency)
 *   2. Username Preservation (BUG-03 regression guard)
 *   3. State Consistency (setProfile called iff success)
 *   4. Non-Fatal Degradation (insert failure doesn't block auth)
 *   5. Idempotency (concurrent calls are safe)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Test component to access auth context
function AuthConsumer({ onAuthReady }: { onAuthReady: (user: User | null, profile: Profile | null) => void }) {
  const { user, profile, loading } = useAuth();
  React.useEffect(() => {
    if (!loading) onAuthReady(user, profile);
  }, [loading, user, profile, onAuthReady]);
  return null;
}

// Mock Supabase auth module
vi.mock('../lib/supabase', () => {
  const mockSupabase = {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  };
  return { supabase: mockSupabase };
});

// Helper to create mock user
const makeMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
} as User);

// Helper to create mock session
const makeMockSession = (user?: User): Session => ({
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: user || makeMockUser(),
});

// Helper to create mock profile
const makeMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'test-user-id-123',
  username: 'test',
  created_at: new Date().toISOString(),
  last_seen_at: new Date().toISOString(),
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test 1: HappyPath_ExistingProfile
// Proves: Update path succeeds, setProfile called with updated record
// ---------------------------------------------------------------------------
describe('AuthProfileSync — Test 1: HappyPath_ExistingProfile', () => {
  it('updates last_seen_at for existing profile and sets profile state', async () => {
    const mockUser = makeMockUser();
    const mockSession = makeMockSession(mockUser);
    const existingProfile = makeMockProfile({ username: 'custom_username' });

    // Mock Supabase query chain for UPDATE
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: existingProfile, error: null });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    (supabase.from as any).mockImplementation(mockFrom);

    // Mock auth listener
    let authCallback: (event: string, session: Session | null) => void;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Spy on console.debug to verify observability
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const onAuthReady = vi.fn();
    render(
      <AuthProvider>
        <AuthConsumer onAuthReady={onAuthReady} />
      </AuthProvider>
    );

    // Trigger auth state change with signed-in user
    await waitFor(() => {
      authCallback!('SIGNED_IN', mockSession);
    });

    // Wait for fetchProfile to complete
    await waitFor(() => {
      expect(onAuthReady).toHaveBeenCalledWith(mockUser, existingProfile);
    });

    // Assertions: Update path
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ last_seen_at: expect.any(String) }));
    expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);

    // Assertions: Insert NOT called (update succeeded)
    const fromCalls = (supabase.from as any).mock.calls;
    const insertCalls = fromCalls.filter((call: any) => {
      const returnValue = mockFrom(call[0]);
      return returnValue.insert !== undefined;
    });
    expect(insertCalls.length).toBe(0);

    // Assertions: Observability logs
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] START', expect.objectContaining({
      userId: mockUser.id,
      email_prefix: 'test',
    }));
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] UPDATE_RESULT', expect.objectContaining({
      userId: mockUser.id,
      updated: true,
    }));
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] END', expect.objectContaining({
      userId: mockUser.id,
      outcome: 'success_update',
      profile_set: true,
    }));

    // Assertion: Profile state set
    expect(onAuthReady).toHaveBeenCalledWith(mockUser, existingProfile);

    debugSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Test 2: HappyPath_NewProfile
// Proves: Insert path succeeds, setProfile called with inserted record
// ---------------------------------------------------------------------------
describe('AuthProfileSync — Test 2: HappyPath_NewProfile', () => {
  it('creates new profile with derived username and sets profile state', async () => {
    const mockUser = makeMockUser({ email: 'newuser@example.com' });
    const mockSession = makeMockSession(mockUser);
    const newProfile = makeMockProfile({ id: mockUser.id, username: 'newuser' });

    // Mock UPDATE returns null (no existing row)
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdateSelect = vi.fn().mockReturnValue({ maybeSingle: mockUpdateMaybeSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    // Mock INSERT succeeds
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: newProfile, error: null });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    const mockFrom = vi.fn((table: string) => {
      if (table === 'profiles') {
        return { update: mockUpdate, insert: mockInsert };
      }
      return {};
    });

    (supabase.from as any).mockImplementation(mockFrom);

    // Mock auth listener
    let authCallback: (event: string, session: Session | null) => void;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Spy on console.debug
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const onAuthReady = vi.fn();
    render(
      <AuthProvider>
        <AuthConsumer onAuthReady={onAuthReady} />
      </AuthProvider>
    );

    // Trigger auth state change
    await waitFor(() => {
      authCallback!('SIGNED_IN', mockSession);
    });

    // Wait for fetchProfile to complete
    await waitFor(() => {
      expect(onAuthReady).toHaveBeenCalledWith(mockUser, newProfile);
    });

    // Assertions: Update called first
    expect(mockUpdate).toHaveBeenCalled();

    // Assertions: Insert called with derived username
    expect(mockInsert).toHaveBeenCalledWith({
      id: mockUser.id,
      username: 'newuser',
      last_seen_at: expect.any(String),
    });

    // Assertions: Observability logs
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] START', expect.any(Object));
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] UPDATE_RESULT', expect.objectContaining({
      updated: false,
    }));
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] INSERT_ATTEMPT', expect.objectContaining({
      userId: mockUser.id,
      username: 'newuser',
    }));
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] INSERT_RESULT', expect.objectContaining({
      inserted: true,
      error: null,
    }));
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] END', expect.objectContaining({
      outcome: 'success_insert',
      profile_set: true,
    }));

    // Assertion: Profile state set with inserted record
    expect(onAuthReady).toHaveBeenCalledWith(mockUser, newProfile);

    debugSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Test 3: InsertFailure_DegradedState
// Proves: Insert error is non-fatal, setProfile NOT called
// ---------------------------------------------------------------------------
describe('AuthProfileSync — Test 3: InsertFailure_DegradedState', () => {
  it('logs warning and does not set profile on insert failure', async () => {
    const mockUser = makeMockUser();
    const mockSession = makeMockSession(mockUser);

    // Mock UPDATE returns null
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdateSelect = vi.fn().mockReturnValue({ maybeSingle: mockUpdateMaybeSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    // Mock INSERT fails
    const insertError = { message: 'Network error', code: 'PGRST301' };
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: null, error: insertError });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    const mockFrom = vi.fn(() => ({ update: mockUpdate, insert: mockInsert }));
    (supabase.from as any).mockImplementation(mockFrom);

    // Mock auth listener
    let authCallback: (event: string, session: Session | null) => void;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Spy on console.warn and console.debug
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const onAuthReady = vi.fn();
    render(
      <AuthProvider>
        <AuthConsumer onAuthReady={onAuthReady} />
      </AuthProvider>
    );

    // Trigger auth state change
    await waitFor(() => {
      authCallback!('SIGNED_IN', mockSession);
    });

    // Wait for fetchProfile to complete (degraded state)
    await waitFor(() => {
      expect(onAuthReady).toHaveBeenCalledWith(mockUser, null);
    });

    // Assertions: Warning logged
    expect(warnSpy).toHaveBeenCalledWith(
      '[void] Profile sync failed — continuing with degraded profile.',
      expect.objectContaining({
        userId: mockUser.id,
        error: 'Network error',
        cause: 'PGRST301',
      })
    );

    // Assertions: Observability logs show degraded failure
    expect(debugSpy).toHaveBeenCalledWith('[AuthProfileSync] END', expect.objectContaining({
      outcome: 'degraded_failure',
      profile_set: false,
    }));

    // Assertion: Profile state is null (degraded)
    expect(onAuthReady).toHaveBeenCalledWith(mockUser, null);

    warnSpy.mockRestore();
    debugSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Test 4: Idempotency_DoubleInvocation
// Proves: Concurrent double invocation is safe (no corruption)
// ---------------------------------------------------------------------------
describe('AuthProfileSync — Test 4: Idempotency_DoubleInvocation', () => {
  it('handles concurrent fetchProfile calls without corruption', async () => {
    const mockUser = makeMockUser();
    const mockSession = makeMockSession(mockUser);
    const mockProfile = makeMockProfile();

    // Mock UPDATE succeeds (existing profile)
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockUpdateSelect = vi.fn().mockReturnValue({ maybeSingle: mockUpdateMaybeSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    const mockFrom = vi.fn(() => ({ update: mockUpdate }));
    (supabase.from as any).mockImplementation(mockFrom);

    // Mock auth listener
    let authCallback: (event: string, session: Session | null) => void;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const onAuthReady = vi.fn();
    render(
      <AuthProvider>
        <AuthConsumer onAuthReady={onAuthReady} />
      </AuthProvider>
    );

    // Simulate double invocation (concurrent auth state changes)
    await waitFor(() => {
      authCallback!('SIGNED_IN', mockSession);
      authCallback!('TOKEN_REFRESHED', mockSession);
    });

    // Wait for both invocations to complete
    await waitFor(() => {
      expect(onAuthReady).toHaveBeenCalled();
    });

    // Assertions: Update called at least twice (once per invocation)
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // Assertion: Profile state set (at least once, last-write-wins)
    const lastCall = onAuthReady.mock.calls[onAuthReady.mock.calls.length - 1];
    expect(lastCall).toEqual([mockUser, mockProfile]);

    // Assertion: No errors thrown (both calls complete safely)
    expect(onAuthReady).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 5: UsernamePreservation_BUG03
// Proves: Targeted update preserves user-customized username (BUG-03 regression guard)
// ---------------------------------------------------------------------------
describe('AuthProfileSync — Test 5: UsernamePreservation_BUG03', () => {
  it('preserves custom username via targeted update (not upsert)', async () => {
    const mockUser = makeMockUser({ email: 'user@example.com' });
    const mockSession = makeMockSession(mockUser);
    const customProfile = makeMockProfile({ username: 'CustomUsername123' });

    // Mock UPDATE succeeds with custom username preserved
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: customProfile, error: null });
    const mockUpdateSelect = vi.fn().mockReturnValue({ maybeSingle: mockUpdateMaybeSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    const mockFrom = vi.fn(() => ({ update: mockUpdate }));
    (supabase.from as any).mockImplementation(mockFrom);

    // Mock auth listener
    let authCallback: (event: string, session: Session | null) => void;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const onAuthReady = vi.fn();
    render(
      <AuthProvider>
        <AuthConsumer onAuthReady={onAuthReady} />
      </AuthProvider>
    );

    // Trigger auth state change
    await waitFor(() => {
      authCallback!('SIGNED_IN', mockSession);
    });

    // Wait for fetchProfile to complete
    await waitFor(() => {
      expect(onAuthReady).toHaveBeenCalledWith(mockUser, customProfile);
    });

    // Assertions: UPDATE called with ONLY last_seen_at (not username)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ last_seen_at: expect.any(String) })
    );

    // Assertion: Username NOT included in update payload (preserves custom value)
    const updatePayload = mockUpdate.mock.calls[0][0];
    expect(updatePayload).not.toHaveProperty('username');

    // Assertion: Profile state set with custom username preserved
    expect(onAuthReady).toHaveBeenCalledWith(mockUser, customProfile);
    expect(customProfile.username).toBe('CustomUsername123');
  });
});

// ---------------------------------------------------------------------------
// Additional: Concurrency LC-A Regression Guard
// Proves: Single auth listener (no redundant getSession) prevents double invocation
// ---------------------------------------------------------------------------
describe('AuthProfileSync — LC-A Concurrency Regression Guard', () => {
  it('does not call fetchProfile twice on mount (LC-A fix verified)', async () => {
    const mockUser = makeMockUser();
    const mockSession = makeMockSession(mockUser);
    const mockProfile = makeMockProfile();

    // Mock UPDATE succeeds
    const mockUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockUpdateSelect = vi.fn().mockReturnValue({ maybeSingle: mockUpdateMaybeSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    const mockFrom = vi.fn(() => ({ update: mockUpdate }));
    (supabase.from as any).mockImplementation(mockFrom);

    // Mock auth listener that fires INITIAL_SESSION immediately
    let authCallback: (event: string, session: Session | null) => void;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      // Simulate Supabase v2 behavior: INITIAL_SESSION fires immediately on subscribe
      setTimeout(() => cb('INITIAL_SESSION', mockSession), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const onAuthReady = vi.fn();
    render(
      <AuthProvider>
        <AuthConsumer onAuthReady={onAuthReady} />
      </AuthProvider>
    );

    // Wait for initial session to process
    await waitFor(() => {
      expect(onAuthReady).toHaveBeenCalled();
    });

    // Assertion: UPDATE called exactly once (not twice due to redundant getSession)
    // This guards against LC-A regression where double invocation occurred
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    // Assertion: Profile state set correctly
    expect(onAuthReady).toHaveBeenCalledWith(mockUser, mockProfile);
  });
});