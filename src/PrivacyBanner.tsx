import { useState } from "react";

const CONSENT_KEY = "void_archive_consent_v1";

/**
 * Consent is read in the state initializer rather than in an effect: the banner
 * is then present on the very first paint instead of appearing one frame after
 * the page has already rendered.
 */
function readStoredConsent(): boolean {
  try {
    return !localStorage.getItem(CONSENT_KEY);
  } catch {
    // localStorage may be unavailable (private mode, sandboxed iframe); the
    // banner simply stays hidden.
    return false;
  }
}

export function PrivacyBanner() {
  const [visible, setVisible] = useState(readStoredConsent);

  const dismiss = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Data and privacy notice"
      className="fixed bottom-0 left-0 right-0 z-[70] border-t border-white/10 bg-black/90 backdrop-blur-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-1">
          TRANSMISSION // DATA_PROTOCOL
        </p>
        <p className="text-white/50 font-light text-xs leading-relaxed">
          The archive uses{" "}
          <span className="text-white/70">Supabase</span> for identity
          persistence,{" "}
          <span className="text-white/70">Google Fonts</span> for typography,
          and may reference images from third-party sources. By continuing, you
          acknowledge these external transmissions.{" "}
          <span className="text-white/30">No advertising. No tracking beyond session identity.</span>
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 px-5 py-2 border border-white/15 hover:border-white/40 text-white/40 hover:text-white text-[9px] font-mono tracking-widest uppercase transition-all rounded-full cursor-pointer"
      >
        Acknowledge
      </button>
    </div>
  );
}
