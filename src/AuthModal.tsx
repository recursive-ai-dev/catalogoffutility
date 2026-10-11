import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import { useAuth, useAuthModal } from "./lib/auth";
import { supabaseAvailable } from "./lib/supabase";
import { getFocusableElements, trapTabFocus } from "./lib/focus";

type Mode = "signin" | "signup";

// Existentially phrased error messages
function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("sign-out is still completing"))
    return "Please wait for sign-out to finish before authenticating again.";
  if (lower.includes("invalid login") || lower.includes("invalid credentials"))
    return "The archive does not recognize this entity. Credentials rejected.";
  if (lower.includes("already registered") || lower.includes("already exists"))
    return "This designation is already inscribed. Perhaps you have forgotten a previous existence.";
  if (lower.includes("password") && lower.includes("short"))
    return "Your passphrase is too brief. The void requires more than this.";
  if (lower.includes("rate limit") || lower.includes("too many") || lower.includes("429"))
    return "Too many attempts. Please wait before trying again.";
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed"))
    return "Please confirm your email address before authenticating.";
  if (lower.includes("email"))
    return "That designation is malformed. The archive expects a valid address.";
  // Default fallback: return a generic atmospheric message to prevent
  // leaking internal system details in the raw error string.
  return "The connection to the archive is unstable. The void does not respond.";
}

export function AuthModal() {
  const { signIn, signUp, connectionError } = useAuth();
  const { hideAuthModal } = useAuthModal();

  const id = useId();
  const titleId = `${id}-title`;
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const statusRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const requestRef = useRef(0);
  const close = useCallback(() => {
    requestRef.current += 1;
    hideAuthModal();
  }, [hideAuthModal]);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Element that held focus before the modal opened; restored on unmount. */
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (emailInputRef.current ?? getFocusableElements(panelRef.current)[0] ?? panelRef.current)?.focus({ preventScroll: true });
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target)) {
        (getFocusableElements(panelRef.current)[0] ?? panelRef.current)?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("focusin", containFocus);
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      document.removeEventListener("focusin", containFocus);
      if (document.body.style.overflow === "hidden") document.body.style.overflow = previousOverflow;
      if (openerRef.current?.isConnected) openerRef.current.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (confirmed) statusRef.current?.focus({ preventScroll: true });
  }, [confirmed]);

  const handleFocusTrap = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && !event.nativeEvent.isComposing && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else {
      trapTabFocus(event, panelRef.current, document.activeElement);
    }
  }, [close]);

  const switchMode = (next: Mode) => {
    if (submittingRef.current) return;
    setMode(next);
    setError(null);
    setConfirmed(false);
    setPassword("");
    setShowPassword(false);
    emailInputRef.current?.focus({ preventScroll: true });
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) close();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !event.isComposing) {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || !event.currentTarget.checkValidity()) return;
    submittingRef.current = true;
    const request = ++requestRef.current;
    const isCurrent = () => mountedRef.current && requestRef.current === request;
    setError(null);
    setLoading(true);
    try {
      const sanitizedEmail = email.trim();
      if (mode === "signin") {
        const result = await signIn(sanitizedEmail, password);
        if (!isCurrent()) return;
        if (result.error) setError(humanizeError(result.error));
        else close();
      } else {
        const result = await signUp(sanitizedEmail, password);
        if (!isCurrent()) return;
        if (result.error) setError(humanizeError(result.error));
        else if (result.needsConfirmation) {
          setPassword("");
          setShowPassword(false);
          setConfirmed(true);
        } else close();
      }
    } catch {
      if (isCurrent()) setError("Authentication could not be completed. Please try again.");
    } finally {
      submittingRef.current = false;
      if (isCurrent()) setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleFocusTrap}
      className="fixed inset-0 z-[80] flex items-center justify-center p-2"
      style={{
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* CRT scanline overlay on backdrop */}
      <div className="absolute inset-0 crt-scanline pointer-events-none opacity-20" />

      {/* Modal panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto mx-4 glass-panel border border-white/8 rounded-2xl"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div>
            <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-1">
              ARCHIVE // IDENTITY_PROTOCOL
            </p>
            <h2 id={titleId} className="text-2xl font-light text-white/90 tracking-widest uppercase font-display">
              {mode === "signin" ? "Authenticate" : "Inscribe Yourself"}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-white/20 hover:text-white/70 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-white/40 outline-none rounded-sm"
            aria-label="Close"
          >
            <span className="material-symbols-outlined font-light text-xl" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="h-px w-full bg-white/5 mt-6" />

        {confirmed ? (
          /* Email confirmation state */
          <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="px-8 py-10 flex flex-col gap-4 items-center text-center">
            <span className="material-symbols-outlined text-4xl text-white/20 font-light animate-pulse" aria-hidden="true">
              mark_email_unread
            </span>
            <p className="text-white/60 font-mono text-xs tracking-widest uppercase leading-relaxed">
              Inscription received.
            </p>
            <p id={descriptionId} className="text-white/30 font-light text-sm leading-relaxed">
              Check your inbox. If you exist, confirmation will arrive. The
              archive will remember you once verified.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-4 px-6 py-2 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 text-[10px] font-mono tracking-widest uppercase transition-colors rounded-full cursor-pointer"
            >
              Return to the void
            </button>
          </div>
        ) : !supabaseAvailable ? (
          /* Supabase connection failure state */
          <div className="px-8 py-10 flex flex-col gap-4 items-center text-center">
            <span className="material-symbols-outlined text-4xl text-red-400/30 font-light animate-pulse" aria-hidden="true">
              cloud_off
            </span>
            <p className="text-white/40 font-mono text-xs tracking-widest uppercase leading-relaxed">
              Archive Unreachable
            </p>
            <p id={descriptionId} className="text-white/20 font-light text-sm leading-relaxed">
              The authentication service is currently unavailable. Non-gated entries remain accessible.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-4 px-6 py-2 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 text-[10px] font-mono tracking-widest uppercase transition-colors rounded-full cursor-pointer"
            >
              Return to the void
            </button>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit}
            aria-busy={loading}
            className="px-8 py-8 flex flex-col gap-6"
          >
            {/* Subtitle */}
            <p id={descriptionId} className="text-white/25 font-light text-xs leading-relaxed">
              {mode === "signin"
                ? "The archive demands verification of continued existence."
                : "To inscribe yourself is to be remembered. The archive does not forget."}
            </p>

            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label htmlFor={emailId} className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
                Designation
              </label>
              <div className="flex items-center gap-3 bg-black/50 border border-white/8 focus-within:border-white/20 rounded-lg px-4 py-3 transition-colors">
                <span className="material-symbols-outlined text-white/20 font-light text-base" aria-hidden="true">
                  alternate_email
                </span>
                <input
                  ref={emailInputRef}
                  id={emailId}
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  disabled={loading}
                  name="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  placeholder="your@designation.void"
                  className="flex-1 bg-transparent border-none outline-none text-white/80 font-mono text-xs placeholder:text-white/15 tracking-wide"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label htmlFor={passwordId} className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
                Passphrase
              </label>
              <div className="flex items-center gap-3 bg-black/50 border border-white/8 focus-within:border-white/20 rounded-lg px-4 py-3 transition-colors">
                <span className="material-symbols-outlined text-white/20 font-light text-base" aria-hidden="true">
                  key
                </span>
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                  maxLength={mode === "signup" ? 128 : undefined}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  disabled={loading}
                  name="password"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  placeholder={showPassword ? "your passphrase" : "••••••••••••"}
                  className={`flex-1 bg-transparent border-none outline-none text-white/80 font-mono text-xs placeholder:text-white/20 ${showPassword ? "tracking-wide" : "tracking-widest"}`}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  className="text-white/20 hover:text-white/50 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-white/30 outline-none rounded-sm px-1"
                  aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                  title={showPassword ? "Hide passphrase" : "Show passphrase"}
                  aria-pressed={showPassword}
                  aria-controls={passwordId}
                >
                  <span className="material-symbols-outlined font-light text-base" aria-hidden="true">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            <div id={errorId} role="alert" aria-live="assertive" aria-atomic="true">
              {(error || connectionError) && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                  <span className="material-symbols-outlined text-red-400/60 font-light text-sm mt-px shrink-0" aria-hidden="true">
                    error_outline
                  </span>
                  <p className="text-red-400/70 font-mono text-[10px] leading-relaxed tracking-wide">
                    {error ?? connectionError}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white/[0.03] border border-white/15 hover:border-white/40 hover:bg-white/7 transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="text-white/30 font-mono text-[10px] tracking-widest uppercase animate-pulse">
                    Verifying existence...
                  </span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-white/40 font-light text-base" aria-hidden="true">
                    {mode === "signin" ? "login" : "person_add"}
                  </span>
                  <span className="text-white/50 font-light tracking-[0.25em] text-[10px] uppercase">
                    {mode === "signin" ? "Authenticate" : "Enter the Registry"}
                  </span>
                </>
              )}
            </button>

            {/* Mode toggle */}
            <div className="h-px w-full bg-white/5" />
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/20 font-mono text-[10px] tracking-widest uppercase">
                {mode === "signin"
                  ? "Not yet inscribed?"
                  : "Already remembered?"}
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  switchMode(mode === "signin" ? "signup" : "signin")
                }
                className="text-white/50 hover:text-white font-mono text-[10px] tracking-widest uppercase underline underline-offset-4 transition-colors cursor-pointer"
              >
                {mode === "signin" ? "Register existence" : "Authenticate"}
              </button>
            </div>
          </form>
        )}

        {/* Bottom watermark */}
        <div className="px-8 pb-5 text-center">
          <p className="text-white/8 font-mono text-[8px] tracking-widest uppercase">
            The archive observes. The archive remembers. The archive does not
            forgive.
          </p>
        </div>
      </div>
    </div>
  );
}
