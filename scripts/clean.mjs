import { rm } from 'node:fs/promises';

// Resolve from the script, so invoking it from another directory is safe.
await Promise.all(['dist', 'coverage', 'release'].map((directory) =>
  rm(new URL(`../${directory}/`, import.meta.url), { recursive: true, force: true }),
));
