/**
 * Vitest setup.
 *
 * Previously this file was `import '@testing-library/react'` — a bare
 * side-effect import that registered nothing. It now installs the jest-dom
 * matchers plus the browser surface the components touch but jsdom omits.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { installMatchMediaStub } from "./matchMedia";

installMatchMediaStub();

// React Testing Library auto-cleans when a global `afterEach` exists, but the
// suites also call `cleanup()` by hand. Registering it here makes teardown
// deterministic rather than dependent on import order.
afterEach(() => {
  cleanup();
});
