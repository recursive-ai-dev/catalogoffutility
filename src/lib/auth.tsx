import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, supabaseAvailable, Profile } from "./supabase";

// ---------------------------------------------------------------------------
// Auth Context — user/session/profile state only.
// Modal visibility lives in a separate AuthModalContext so that toggling the
// auth modal does NOT re-render every useAuth() consumer (e.g. Catalog cards).
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Non-null when Supabase is unreachable or credentials are invalid. */
  connectionError: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Auth Modal Context — modal visibility state only.
// ---------------------------------------------------------------------------

interface AuthModalContextValue {
  authModalVisible: boolean;
  showAuthModal: () => void;
  hideAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// ---------------------------------------------------------------------------
// AuthModalProvider — standalone provider for modal state.
// Can be placed inside AuthProvider so consumers of either context stay minimal.
// ---------------------------------------------------------------------------

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const showAuthModal = useCallback(() => setAuthModalVisible(true), []);
  const hideAuthModal = useCallback(() => setAuthModalVisible(false), []);

  const value = useMemo(
    () => ({ authModalVisible, showAuthModal, hideAuthModal }),
    [authModalVisible, showAuthModal, hideAuthModal],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// AuthProvider — auth state only, wraps children with AuthModalProvider.
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // When Supabase is unconfigured there is no session to wait for, so the
  // initial state is already terminal. Seeding it here (rather than assigning
  // it inside the subscription effect) avoids a loading flash and a cascading
  // second render on every cold start.
  const [loading, setLoading] = useState(supabaseAvailable);
  const [connectionError, setConnectionError] = useState<string | null>(
    supabaseAvailable
      ? null
      : "Authentication service is unavailable. Non-gated entries remain accessible.",
  );

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    const now = new Date().toISOString();

    // Attempt a targeted update of last_seen_at only.
    // This preserves any server-side username customisation the user may have
    // made; the upsert path that always overwrote `username` with the email
    // prefix was a data-integrity hazard (BUG-03).
    const { data: updated } = await supabase
      .from("profiles")
      .update({ last_seen_at: now })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (updated) {
      setProfile(updated as Profile);
      return;
    }

    // Row does not exist yet — insert with email-derived initial username.
    const { data: inserted, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: email.split("@")[0].slice(0, 32),
        last_seen_at: now,
      })
      .select()
      .single();

    if (error) {
      // Profile sync failure is non-fatal: the user remains authenticated and
      // retains full access. Degrade gracefully and surface to the console only.
      console.warn("[void] Profile sync failed — continuing with degraded profile.", error.message);
      return;
    }
    if (inserted) setProfile(inserted as Profile);
  }, []);

  useEffect(() => {
    // If Supabase is not configured, degrade gracefully — auth is unavailable
    // but the rest of the app (non-gated entries) remains fully functional.
    // `loading` and `connectionError` were already seeded to the correct values,
    // so there is nothing to assign here.
    if (!supabaseAvailable) {
      return undefined;
    }

    // In Supabase v2, onAuthStateChange fires INITIAL_SESSION on subscribe,
    // making a separate getSession() call redundant. Using both causes fetchProfile
    // to be invoked twice concurrently on every session restore (LC-A). This single
    // listener is the sole authoritative source for session and profile state.
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email ?? "");
        } else {
          setProfile(null);
        }
        setConnectionError(null);
        setLoading(false);
      });
      subscription = data.subscription;
    } catch (err) {
      // Supabase client threw during subscription setup — surface as a recoverable error.
      const msg = err instanceof Error ? err.message : "Unknown connection error";
      console.error("[void] Auth subscription failed:", msg);
      /* eslint-disable react-hooks/set-state-in-effect -- error path of an
         external-system subscription. It cannot run on a normal mount, and no
         render-time state can represent "the subscription call threw". */
      setConnectionError(`Authentication service connection failed: ${msg}`);
      setLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }

    return () => subscription?.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        return { error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        setConnectionError(`Sign-in failed: ${msg}`);
        return { error: "Authentication service is unreachable. Please try again later." };
      }
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null; needsConfirmation: boolean }> => {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message, needsConfirmation: false };
        // If email confirmation is required, identities will be empty
        const needsConfirmation =
          !data.session && !data.user?.confirmed_at;
        return { error: null, needsConfirmation };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        setConnectionError(`Sign-up failed: ${msg}`);
        return { error: "Authentication service is unreachable. Please try again later.", needsConfirmation: false };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    // Clear local identity first: if the network call throws, the session token
    // is still being discarded locally and the UI must not keep claiming a
    // signed-in observer.
    setProfile(null);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      console.warn("[void] Sign-out could not reach the archive:", msg);
    }
  }, []);

  // Memoize the context value — contains only auth state, no modal fields,
  // so toggling the modal no longer triggers re-renders of all auth consumers.
  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      connectionError,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, profile, loading, connectionError, signIn, signUp, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      <AuthModalProvider>
        {children}
      </AuthModalProvider>
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with the provider it reads.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with the provider it reads.
export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
}
