import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
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

  const mountedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const profileGenerationRef = useRef(0);
  const signingOutRef = useRef(false);

  const fetchProfile = useCallback(async (
    userId: string,
    email: string,
    isCurrent: () => boolean,
  ) => {
    const now = new Date().toISOString();
    const columns = "id,username,created_at,last_seen_at";
    try {
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ last_seen_at: now })
        .eq("id", userId)
        .select(columns)
        .maybeSingle();
      if (!isCurrent()) return;
      // A failed update does not mean the row is absent. Do not insert over a
      // permission, transport, or database error.
      if (updateError) {
        console.warn("[void] Profile synchronization is unavailable.");
        return;
      }
      if (updated) {
        if (updated.id === userId) setProfile(updated as Profile);
        return;
      }

      const { data: inserted, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          username: email.split("@")[0].slice(0, 32) || `observer-${userId.slice(0, 8)}`,
          last_seen_at: now,
        })
        .select(columns)
        .single();
      if (!isCurrent()) return;
      if (error?.code === "23505") {
        // Another tab (or the signup trigger) may have created this row while
        // the first update was in flight. Read it without overwriting its name.
        const { data: existing } = await supabase
          .from("profiles")
          .select(columns)
          .eq("id", userId)
          .maybeSingle();
        if (isCurrent() && existing?.id === userId) setProfile(existing as Profile);
      } else if (error) {
        console.warn("[void] Profile synchronization is unavailable.");
      } else if (inserted?.id === userId) {
        setProfile(inserted as Profile);
      }
    } catch {
      // Profile failures must never reject an auth callback or revoke access.
      if (isCurrent()) console.warn("[void] Profile synchronization is unavailable.");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    if (!supabaseAvailable) {
      return () => { mountedRef.current = false; };
    }

    let subscription: { unsubscribe: () => void } | null = null;
    let profileTimer: ReturnType<typeof setTimeout> | undefined;
    const startupTimer = setTimeout(() => {
      if (!active) return;
      setConnectionError("Authentication is taking longer than expected. Please try again.");
      setLoading(false);
    }, 10_000);

    try {
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!active || (signingOutRef.current && nextSession)) return;
        clearTimeout(startupTimer);
        const nextUser = nextSession?.user ?? null;
        const changedUser = currentUserIdRef.current !== (nextUser?.id ?? null);
        setSession(nextSession);
        setUser(nextUser);
        setConnectionError(null);
        setLoading(false);

        if (changedUser || !nextUser) {
          currentUserIdRef.current = nextUser?.id ?? null;
          profileGenerationRef.current += 1;
          setProfile(null);
          clearTimeout(profileTimer);
        }
        if (nextUser && (changedUser || event === "USER_UPDATED")) {
          const generation = ++profileGenerationRef.current;
          clearTimeout(profileTimer);
          // Supabase invokes auth listeners while holding its auth lock. Defer
          // queries to a new task so restoring a session cannot deadlock them.
          profileTimer = setTimeout(() => {
            const isCurrent = () => active &&
              profileGenerationRef.current === generation &&
              currentUserIdRef.current === nextUser.id;
            if (isCurrent()) void fetchProfile(nextUser.id, nextUser.email ?? "", isCurrent);
          }, 0);
        }
      });
      subscription = data.subscription;
    } catch {
      clearTimeout(startupTimer);
      /* eslint-disable react-hooks/set-state-in-effect -- subscription setup failure is an external-system error. */
      setConnectionError("Authentication service connection failed. Please try again.");
      setLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }

    return () => {
      active = false;
      mountedRef.current = false;
      profileGenerationRef.current += 1;
      // Strict Mode resubscribes on the same instance: permit its new initial
      // session to fetch a profile after the first subscription was cancelled.
      currentUserIdRef.current = null;
      clearTimeout(startupTimer);
      clearTimeout(profileTimer);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    if (!supabaseAvailable) return { error: "Authentication service is unavailable." };
    if (signingOutRef.current) return { error: "Sign-out is still completing. Please try again." };
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) return { error: "Email and password are required." };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (mountedRef.current) setConnectionError(null);
      return { error: error?.message ?? null };
    } catch {
      // This operation can be retried immediately; the service is not known to
      // be permanently unavailable just because one request failed.
      return { error: "Authentication service is unreachable. Please try again." };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
  ): Promise<{ error: string | null; needsConfirmation: boolean }> => {
    if (!supabaseAvailable) {
      return { error: "Authentication service is unavailable.", needsConfirmation: false };
    }
    if (signingOutRef.current) {
      return { error: "Sign-out is still completing. Please try again.", needsConfirmation: false };
    }
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      return { error: "Email and password are required.", needsConfirmation: false };
    }
    try {
      const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
      if (mountedRef.current) setConnectionError(null);
      if (error) return { error: error.message, needsConfirmation: false };
      // Only an actual session authenticates the browser. Confirmation metadata
      // on a returned user alone is not evidence of a signed-in session.
      return { error: null, needsConfirmation: !data.session };
    } catch {
      return { error: "Authentication service is unreachable. Please try again.", needsConfirmation: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    profileGenerationRef.current += 1;
    currentUserIdRef.current = null;
    setProfile(null);
    setUser(null);
    setSession(null);
    setLoading(false);
    const restoreIdentity = () => {
      if (!mountedRef.current || currentUserIdRef.current !== null) return;
      currentUserIdRef.current = user?.id ?? null;
      setUser(user);
      setSession(session);
      setProfile(profile);
      setConnectionError("Sign-out could not be completed. Please try again.");
    };
    try {
      if (!supabaseAvailable) return;
      const { error } = await supabase.auth.signOut({ scope: "local" });
      // Supabase returns most failures as values rather than rejected promises.
      if (error) throw error;
    } catch {
      restoreIdentity();
      // Consumers need a rejected operation to expose their retry controls.
      throw new Error("Sign-out could not be completed. Please try again.");
    } finally {
      signingOutRef.current = false;
    }
  }, [user, session, profile]);

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
