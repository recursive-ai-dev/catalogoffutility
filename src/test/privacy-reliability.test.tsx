import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrivacyBanner } from "../PrivacyBanner";
const key = "void_archive_consent_v1";
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe("privacy acknowledgment", () => {
  it("shows a labeled region on the first render when no preference exists", () => {
    render(<PrivacyBanner />);
    expect(screen.getByRole("region", { name: "Data and privacy notice" })).toHaveAccessibleDescription(/Supabase/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("accepts only the recognized acknowledgment value", () => {
    localStorage.setItem(key, "false");
    render(<PrivacyBanner />);
    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeInTheDocument();
  });
  it("stays hidden for a stored acknowledgment", () => {
    localStorage.setItem(key, "1"); render(<PrivacyBanner />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("still explains external requests when storage access is denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<PrivacyBanner />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });
  it("dismisses for this render even if preference storage fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    render(<PrivacyBanner />); fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("records acknowledgment explicitly on a button click", () => {
    render(<PrivacyBanner />); fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(localStorage.getItem(key)).toBe("1");
  });
  it("dismisses when another tab acknowledges the same notice", () => {
    render(<PrivacyBanner />);
    fireEvent(window, new StorageEvent("storage", { key, newValue: "1", storageArea: localStorage }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("shows the notice again when another tab clears the preference", () => {
    localStorage.setItem(key, "1"); render(<PrivacyBanner />);
    fireEvent(window, new StorageEvent("storage", { key: null, newValue: null, storageArea: localStorage }));
    expect(screen.getByRole("region")).toBeInTheDocument();
  });
  it("ignores unrelated storage keys and session-storage events", () => {
    render(<PrivacyBanner />);
    fireEvent(window, new StorageEvent("storage", { key: "unrelated", newValue: "1", storageArea: localStorage }));
    fireEvent(window, new StorageEvent("storage", { key, newValue: "1", storageArea: sessionStorage }));
    expect(screen.getByRole("region")).toBeInTheDocument();
  });
  it("does not submit a surrounding form when acknowledged", () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submit}><PrivacyBanner /></form>);
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(submit).not.toHaveBeenCalled();
  });
});
