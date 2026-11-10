import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { presentationRules } from "./eslint.presentation.js";

export default defineConfig([
  globalIgnores(["dist", "storybook-static", "node_modules", "supabase", "api", "public/mockServiceWorker.js"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
  },
  {
    // A leading underscore marks a name as deliberately unused (`_supplierId`,
    // `{ change: _change, ...line }`), and a rest sibling is the idiom for
    // "everything except these keys". typescript-eslint's default honours
    // neither, which flags code that is already written this way.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Tooling files run in Node, not the browser.
    files: ["*.{ts,js}", ".storybook/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.node },
  },
  // Last, so its bans win any conflict. Append, never replace: dropping this in
  // as the whole config would delete react-hooks and typescript-eslint.
  ...presentationRules,
]);
