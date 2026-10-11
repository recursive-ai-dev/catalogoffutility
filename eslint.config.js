import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * Flat ESLint config.
 *
 * The project previously had no linter at all — `npm run lint` was an alias for
 * `tsc --noEmit`. That matters here specifically: `react-hooks/rules-of-hooks`
 * is the rule that catches hooks called after a conditional return, which was a
 * live crash in `UserSection` and is invisible to the type-checker.
 */
export default tseslint.config(
  {
    // Build output, vendored single-file apps, and the Electron entrypoints are
    // not authored under the same rules as the React source.
    ignores: ["dist/**", "release/**", "coverage/**", "node_modules/**", "public/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["*.cjs", "scripts/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // A console statement in this codebase is deliberate atmosphere, not noise.
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/test/**/*.{ts,tsx}"],
    rules: {
      // Tests reach into globals installed by Vitest and the setup file.
      "react-refresh/only-export-components": "off",
    },
  },
);
