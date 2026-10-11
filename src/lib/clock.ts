/** A clock can be supplied to replay log timestamps deterministically. */
export interface Clock {
  /** Current time formatted as HH:MM:SS using the clock's time zone. */
  timeString(): string;
  /** Current instant as an independent Date object. */
  now(): Date;
}

function formatter(timeZone?: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    // h23 renders midnight as 00 rather than the locale's possible 24.
    hourCycle: "h23",
    ...(timeZone ? { timeZone } : {}),
  });
}

const liveFormatter = formatter();

/** Live wall clock in the user's local time zone. */
export const realClock: Readonly<Clock> = Object.freeze({
  timeString: () => liveFormatter.format(new Date()),
  now: () => new Date(),
});

/** Frozen clocks default to UTC so replay does not depend on the host's zone. */
export function makeFakeClock(fixed: Date, timeZone = "UTC"): Readonly<Clock> {
  const fixedMs = fixed.getTime();
  if (!Number.isFinite(fixedMs)) {
    throw new RangeError("A fake clock requires a valid Date.");
  }
  const time = formatter(timeZone).format(new Date(fixedMs));
  return Object.freeze({
    timeString: () => time,
    now: () => new Date(fixedMs),
  });
}
