import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

function Boom({ message }: { message: string }): never {
  throw new Error(message);
}

afterEach(() => cleanup());

describe("ErrorBoundary", () => {
  it("renders children while nothing has thrown", () => {
    render(
      <ErrorBoundary>
        <p>the archive is intact</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("the archive is intact")).toBeInTheDocument();
  });

  it("catches a render error and offers a recovery path instead of a blank page", () => {
    // React logs the caught error; keep the test output readable.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom message="reality anchor destabilised" />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: /The render collapsed/i })).toBeInTheDocument();
    expect(screen.getByText("reality anchor destabilised")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Re-Initialize/i })).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("recovers and re-renders children after Re-Initialize", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = true;

    function Maybe() {
      if (shouldThrow) throw new Error("transient");
      return <p>the archive recovered</p>;
    }

    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("heading", { name: /The render collapsed/i })).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /Re-Initialize/i }));

    expect(screen.getByText("the archive recovered")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("gives its recovery screen a reachable main landmark", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom message="x" />
      </ErrorBoundary>,
    );
    const main = document.getElementById("main-content");
    expect(main?.tagName).toBe("MAIN");
    expect(main).toHaveAttribute("tabindex", "-1");
    spy.mockRestore();
  });
});
