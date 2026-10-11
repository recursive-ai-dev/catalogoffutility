import { describe, expect, it } from "vitest";
import { makeFakeClock, realClock } from "../lib/clock";

describe("Clock replay guarantees", () => {
  it("renders midnight with hour 00", () => {
    expect(makeFakeClock(new Date("2026-01-01T00:00:00Z")).timeString()).toBe("00:00:00");
  });
  it("uses UTC by default independently of the host zone", () => {
    expect(makeFakeClock(new Date("2026-07-01T08:09:10Z")).timeString()).toBe("08:09:10");
  });
  it("supports an explicit display zone including daylight saving", () => {
    expect(makeFakeClock(new Date("2026-07-01T08:09:10Z"), "America/Moncton").timeString()).toBe("05:09:10");
  });
  it("rejects invalid seeds with a useful error", () => {
    expect(() => makeFakeClock(new Date(Number.NaN))).toThrow("requires a valid Date");
  });
  it("isolates seed mutation and every returned Date", () => {
    const seed = new Date("2026-01-01T12:00:00Z");
    const clock = makeFakeClock(seed);
    seed.setTime(0);
    clock.now().setTime(1);
    expect(clock.now().toISOString()).toBe("2026-01-01T12:00:00.000Z");
    expect(clock.timeString()).toBe("12:00:00");
  });
  it("protects clock providers from accidental mutation", () => {
    expect(Object.isFrozen(realClock)).toBe(true);
    expect(Object.isFrozen(makeFakeClock(new Date(0)))).toBe(true);
  });
});
