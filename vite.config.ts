/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/**
 * .env.local is git-ignored, so a fresh git worktree never has it and the app
 * would silently fall back to the static mock data. When this checkout has no
 * .env.local, read the env files from the main checkout instead (the folder
 * that owns the shared .git directory). A .env.local of its own always wins.
 */
function resolveEnvDir(): string {
  if (existsSync(path.join(dirname, '.env.local'))) return dirname;
  try {
    const commonDir = execSync('git rev-parse --path-format=absolute --git-common-dir', {
      cwd: dirname,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    const mainCheckout = path.dirname(commonDir);
    return existsSync(path.join(mainCheckout, '.env.local')) ? mainCheckout : dirname;
  } catch {
    return dirname; // no git (e.g. a build container): use this folder
  }
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  envDir: resolveEnvDir(),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    // 5173 by default; PORT lets a second dev server run alongside the first.
    port: Number(process.env.PORT) || 5173
  },
  test: {
    projects: [{
      // Plain node project for the logic that decides what the UI shows — label
      // derivation, field validation, stage columns. No browser needed, so it
      // runs in a second rather than the storybook project's twenty.
      extends: true,
      test: {
        name: 'unit',
        environment: 'node',
        include: ['src/**/*.test.ts']
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        // .env.local holds the real Supabase credentials; stories must never reach
        // that database, so blank them and let db.ts use the static dataset.
        env: {
          VITE_SUPABASE_URL: '',
          VITE_SUPABASE_ANON_KEY: ''
        },
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});