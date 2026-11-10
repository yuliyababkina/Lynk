import type { Preview } from "@storybook/react-vite";
import React from "react";
import { I18nProvider } from "../src/lib/i18n";
import "../src/index.css";
import { mswHandlers } from "./msw-handlers";

/** Toolbar toggle for the preset's light / dark themes. */
export const globalTypes = {
  theme: {
    description: "Theme",
    defaultValue: "light",
    toolbar: {
      title: "Theme",
      icon: "circlehollow",
      items: [
        { value: "light", title: "Light" },
        { value: "dark", title: "Dark" },
      ],
      dynamicTitle: true,
    },
  },
};

const preview: Preview = {
  /* The language lives in localStorage ("lynk-lang"). A story that flips to
     German would otherwise leave every later story in German. */
  beforeEach() {
    try {
      localStorage.setItem("lynk-lang", "en");
    } catch {
      /* storage unavailable — the provider falls back to English anyway */
    }
  },
  parameters: {
    msw: { handlers: mswHandlers },
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: "todo" },
  },
  decorators: [
    (Story, context) => {
      const dark = context.globals.theme === "dark";
      return React.createElement(
        "div",
        {
          className: dark ? "dark" : "",
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            // Full-screen stories (the platform shell) fill the canvas edge to edge.
            padding: context.parameters.layout === "fullscreen" ? 0 : "1.5rem",
            minHeight: "100%",
          },
        },
        React.createElement(Story)
      );
    },
    /* Every component that renders user-facing text calls useI18n, which throws
       outside a provider. Wrapping here rather than per-story keeps new stories
       from failing for a reason that has nothing to do with what they test. */
    (Story) => React.createElement(I18nProvider, null, React.createElement(Story)),
  ],
};

export default preview;
