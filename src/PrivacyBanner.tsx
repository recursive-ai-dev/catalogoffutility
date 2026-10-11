import { useEffect, useId, useState } from "react";

const CONSENT_KEY = "void_archive_consent_v1";

/**
 * Consent is read in the state initializer rather than in an effect: the banner
 * is then present on the very first paint instead of appearing one frame after
 * the page has already rendered.
 */
function readStoredConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== "1";
  } catch {
    // Storage failures do not count as acknowledgment. Show the notice.
    return true;
  }
}

export function PrivacyBanner() {
  const [visible, setVisible] = useState(readStoredConsent);
  const id = useId();
  const titleId = `${id}-privacy-title`;
  const descriptionId = `${id}-privacy-description`;

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      // Acknowledgment and clearing storage in another tab should agree here.
      if (event.key === CONSENT_KEY || event.key === null) {
        try {
          if (event.storageArea && event.storageArea !== window.localStorage) return;
        } catch { return; }
        setVisible(event.key === null || event.newValue !== "1");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed bottom-0 left-0 right-0 z-[70] border-t border-white/10 bg-black/90 backdrop-blur-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <p id={titleId} className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-1">
          Data and privacy notice
        </p>
        <p id={descriptionId} className="text-white/50 font-light text-xs leading-relaxed">
          The archive uses{" "}
          <span className="text-white/70">Supabase</span> for identity
          persistence,{" "}
          <span className="text-white/70">Google Fonts</span> for typography,
          and may reference images from third-party sources. These services receive
          network requests when their content loads. Acknowledging this notice
          saves your preference on this device.{" "}
          <span className="text-white/30">No advertising. This notice does not change your browser’s privacy settings.</span>
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 px-5 py-2 border border-white/15 hover:border-white/40 text-white/40 hover:text-white text-[9px] font-mono tracking-widest uppercase transition-all rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
      >
        Acknowledge
      </button>
    </div>
  );
}
