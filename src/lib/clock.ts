/**
 * Clock — Determinism Provider
 *
 * Abstracts all reads of the system clock so that components that embed
 * timestamps in log entries can be driven by a fake clock in tests, giving
 * full seed-control and replay determinism.
 *
 * Production code uses `realClock` (the default when no clock prop is given).
 * Tests pass `makeFakeClock(fixed)` to freeze time at a known instant.
 */

export interface Clock {
  /** Current time formatted as HH:MM:SS (24-hour, en-US locale). */
  timeString(): string;
  /** Current instant as a Date object. */
  now(): Date;
}

/**
 * Pre-allocated formatter to avoid the overhead of repeated Intl object creation.
 * This yields a measurable performance gain in the Chamber component where
 * logs are generated frequently (BUG-15).
 */
const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Live wall-clock; used by default in all production renders. */
export const realClock: Clock = {
  timeString: () => TIME_FORMATTER.format(new Date()),
  now: () => new Date(),
};

/**
 * Returns a deterministic Clock permanently frozen at `fixed`.
 * All calls to `timeString()` and `now()` return the same value, so any
 * sequence of actions that reads the clock produces bit-identical output
 * when replayed with the same seed.
 */
export function makeFakeClock(fixed: Date): Clock {
  const ts = TIME_FORMATTER.format(fixed);
  return {
    timeString: () => ts,
    now: () => new Date(fixed.getTime()),
  };
}
