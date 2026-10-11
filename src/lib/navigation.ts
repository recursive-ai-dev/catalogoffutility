import { flushSync } from "react-dom";

interface Transition {
  skipTransition?: () => void;
  ready?: Promise<unknown>;
  updateCallbackDone?: Promise<unknown>;
  finished?: Promise<unknown>;
}

let activeTransition: Transition | undefined;
let generation = 0;

/** Commit navigation once, including when a browser rejects its animation. */
export function withViewTransition(update: () => void): void {
  const request = ++generation;
  let committed = false;
  const commit = () => {
    if (committed || request !== generation) return;
    committed = true;
    flushSync(update);
  };

  try {
    activeTransition?.skipTransition?.();
  } catch {
    // Animation cancellation must not prevent navigation.
  }
  activeTransition = undefined;

  const start = document.startViewTransition;
  if (typeof start !== "function" || document.hidden ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    commit();
    return;
  }

  try {
    const transition = start.call(document, commit) as Transition;
    activeTransition = transition;
    void transition.ready?.catch(() => {});
    void transition.updateCallbackDone?.catch(commit);
    void transition.finished?.catch(() => {}).then(() => {
      if (activeTransition === transition) activeTransition = undefined;
    });
  } catch {
    commit();
  }
}
