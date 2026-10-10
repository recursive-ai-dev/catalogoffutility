import React from "react";
import { SITE_TITLE } from "./lib/constants";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort boundary for the view tree.
 *
 * React unmounts the entire tree when a render throws, so before this existed a
 * single bad entry (a malformed `longDescription`, an image that fails to
 * decode, a Supabase shape change) turned the archive into a blank page with no
 * explanation and no way back. This keeps the failure inside the frame and
 * offers a recovery path, in the register the rest of the product uses.
 *
 * Deliberately dependency-free: an error boundary that can itself throw is
 * worse than none.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Correlatable with the console entry a developer will actually see.
    console.error(`[${SITE_TITLE}] View render failed.`, error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  override render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-black px-6 text-center font-sans text-white antialiased outline-none"
      >
        <div className="absolute inset-0 pointer-events-none atmosphere" aria-hidden="true" />
        <span
          className="material-symbols-outlined text-5xl text-white/20 font-light"
          aria-hidden="true"
        >
          error_outline
        </span>
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-light uppercase tracking-widest text-white/80">
            The render collapsed
          </h1>
          <p className="max-w-md text-sm font-light leading-relaxed text-white/40">
            Something in the archive failed to draw itself. The fault is recorded
            below; nothing you did caused it.
          </p>
        </div>
        <pre className="max-w-xl overflow-auto rounded-xl border border-red-900/30 bg-red-950/10 p-4 text-left font-mono text-[10px] leading-relaxed text-red-300/60">
          {error.message || "Unknown fault"}
        </pre>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-full border border-white/20 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white/60 transition-colors hover:border-white/50 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40 outline-none cursor-pointer"
          >
            Re-Initialize
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-white/10 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white/30 transition-colors hover:border-white/25 hover:text-white/70 focus-visible:ring-1 focus-visible:ring-white/40 outline-none cursor-pointer"
          >
            Reload the void
          </button>
        </div>
      </main>
    );
  }
}
