import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./lib/auth";

type Mode = "signin" | "signup";

// Existentially phrased error messages
function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials"))
    return "The archive does not recognize this entity. Credentials rejected.";
  if (lower.includes("already registered") || lower.includes("already exists"))
    return "This designation is already inscribed. Perhaps you have forgotten a previous existence.";
  if (lower.includes("password") && lower.includes("short"))
    return "Your passphrase is too brief. The void requires more than this.";
  if (lower.includes("email"))
    return "That designation is malformed. The archive expects a valid address.";
  if (lower.includes("rate limit"))
    return "Too many attempts. The archive is watching. It remembers.";
  return raw;
}

export function AuthModal() {
  const { hideAuthModal, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the email input when the modal mounts
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // WCAG 2.1 SC 2.1.2: Trap focus inside the modal while it is open.
  // All Tab / Shift+Tab keypresses are constrained to focusable descendants
  // of the modal panel so keyboard users cannot navigate behind the overlay.
  const handleFocusTrap = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null); // visible elements only
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // Reset state when toggling modes
  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setConfirmed(false);
    setPassword("");
  };

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) hideAuthModal();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideAuthModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hideAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(humanizeError(error));
      } else {
        hideAuthModal();
      }
    } else {
      const { error, needsConfirmation } = await signUp(email, password);
      if (error) {
        setError(humanizeError(error));
      } else if (needsConfirmation) {
        setConfirmed(true);
      } else {
        hideAuthModal();
      }
    }

    setLoading(false);
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleFocusTrap}
      className="fixed inset-0 z-50 flex items-center justify-center"
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
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md mx-4 glass-panel border border-white/8 rounded-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div>
            <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-1">
              ARCHIVE // IDENTITY_PROTOCOL
            </p>
            <h2 id="auth-modal-title" className="text-2xl font-light text-white/90 tracking-widest uppercase font-display">
              {mode === "signin" ? "Authenticate" : "Inscribe Yourself"}
            </h2>
          </div>
          <button
            onClick={hideAuthModal}
            className="text-white/20 hover:text-white/70 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined font-light text-xl">
              close
            </span>
          </button>
        </div>

        <div className="h-px w-full bg-white/5 mt-6" />

        {confirmed ? (
          /* Email confirmation state */
          <div className="px-8 py-10 flex flex-col gap-4 items-center text-center">
            <span className="material-symbols-outlined text-4xl text-white/20 font-light animate-pulse">
              mark_email_unread
            </span>
            <p className="text-white/60 font-mono text-xs tracking-widest uppercase leading-relaxed">
              Inscription received.
            </p>
            <p className="text-white/30 font-light text-sm leading-relaxed">
              Check your inbox. If you exist, confirmation will arrive. The
              archive will remember you once verified.
            </p>
            <button
              onClick={hideAuthModal}
              className="mt-4 px-6 py-2 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 text-[10px] font-mono tracking-widest uppercase transition-colors rounded-full cursor-pointer"
            >
              Return to the void
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-6">
            {/* Subtitle */}
            <p className="text-white/25 font-light text-xs leading-relaxed">
              {mode === "signin"
                ? "The archive demands verification of continued existence."
                : "To inscribe yourself is to be remembered. The archive does not forget."}
            </p>

            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="auth-email" className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
                Designation
              </label>
              <div className="flex items-center gap-3 bg-black/50 border border-white/8 focus-within:border-white/20 rounded-lg px-4 py-3 transition-colors">
                <span className="material-symbols-outlined text-white/20 font-light text-base" aria-hidden="true">
                  alternate_email
                </span>
                <input
                  ref={emailInputRef}
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@designation.void"
                  className="flex-1 bg-transparent border-none outline-none text-white/80 font-mono text-xs placeholder:text-white/15 tracking-wide"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="auth-password" className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
                Passphrase
              </label>
              <div className="flex items-center gap-3 bg-black/50 border border-white/8 focus-within:border-white/20 rounded-lg px-4 py-3 transition-colors">
                <span className="material-symbols-outlined text-white/20 font-light text-base" aria-hidden="true">
                  key
                </span>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="flex-1 bg-transparent border-none outline-none text-white/80 font-mono text-xs placeholder:text-white/20 tracking-widest"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
              </div>
            </div>

            {/* Error */}
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                  <span className="material-symbols-outlined text-red-400/60 font-light text-sm mt-px shrink-0" aria-hidden="true">
                    error_outline
                  </span>
                  <p className="text-red-400/70 font-mono text-[10px] leading-relaxed tracking-wide">
                    {error}
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
                  <span className="material-symbols-outlined text-white/40 font-light text-base">
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
