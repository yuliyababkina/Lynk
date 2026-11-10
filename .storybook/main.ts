import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "msw-storybook-addon"
  ],
  "framework": "@storybook/react-vite",
  // Serves public/mockServiceWorker.js, which msw-storybook-addon registers.
  "staticDirs": ["../public"],
  // .env.local holds the real Supabase credentials. LynkDataProvider (used by
  // the shell story) both reads and writes, so a story must never see them:
  // blank, db.ts falls back to the static dataset in src/data.ts and nothing
  // is persisted.
  viteFinal: async (viteConfig) => {
    viteConfig.define = {
      ...viteConfig.define,
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(""),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(""),
    };
    return viteConfig;
  },
};
export default config;