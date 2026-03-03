import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, Profile } from "./supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authModalVisible: boolean;
  showAuthModal: () => void;
  hideAuthModal: () => void;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalVisible, setAuthModalVisible] = useState(false);

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
        username: email.split("@")[0],
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
    // In Supabase v2, onAuthStateChange fires INITIAL_SESSION on subscribe,
    // making a separate getSession() call redundant. Using both causes fetchProfile
    // to be invoked twice concurrently on every session restore (LC-A). This single
    // listener is the sole authoritative source for session and profile state.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "");
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const showAuthModal = useCallback(() => setAuthModalVisible(true), []);
  const hideAuthModal = useCallback(() => setAuthModalVisible(false), []);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null; needsConfirmation: boolean }> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message, needsConfirmation: false };
      // If email confirmation is required, identities will be empty
      const needsConfirmation =
        !data.session && !data.user?.confirmed_at;
      return { error: null, needsConfirmation };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authModalVisible,
        showAuthModal,
        hideAuthModal,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
