import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProductPage } from "../ProductPage";
import React from "react";

const mockApp = {
  id: "test-app",
  title: "Test App",
  description: "A test description",
  image: "/test.svg",
  tags: ["Test"],
};

describe("ProductPage Copy ID UX", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the app id to clipboard when clicked", async () => {
    render(
      <ProductPage
        app={mockApp}
        onBack={() => {}}
        onEnter={() => {}}
        onTagSelect={() => {}}
      />
    );

    const copyBtn = screen.getByLabelText("Copy entry ID");
    await act(async () => {
       fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-app");
    expect(screen.getByText("COPIED")).toBeDefined();
    expect(screen.getByLabelText("ID copied")).toBeDefined();
  });

  it("resets the copied state after 2 seconds", async () => {
    render(
      <ProductPage
        app={mockApp}
        onBack={() => {}}
        onEnter={() => {}}
        onTagSelect={() => {}}
      />
    );

    const copyBtn = screen.getByLabelText("Copy entry ID");
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByText("COPIED")).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("COPIED")).toBeNull();
    expect(screen.getByText("COPY ID")).toBeDefined();
  });
});
