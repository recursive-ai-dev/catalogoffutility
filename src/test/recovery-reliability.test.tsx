import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

function ThrowValue({ value }: { value: unknown }): never { throw value; }

describe("recovery from arbitrary JavaScript exceptions", () => {
  it.each([
    { label: "null", value: null },
    { label: "undefined", value: undefined },
    { label: "a string", value: "lost connection" },
    { label: "an object with hostile coercion", value: { toString() { throw new Error("bad coercion"); } } },
  ])("recovers safely from $label", ({ value }) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><ThrowValue value={value} /></ErrorBoundary>);
    expect(screen.getByRole("heading", { name: "The render collapsed" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).not.toHaveTextContent(/^$/);
    expect(screen.getByRole("main", { name: "The render collapsed" })).toHaveFocus();
  });
});
