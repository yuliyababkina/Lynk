import type { Preview } from "@storybook/react-vite";
import React from "react";
import { I18nProvider } from "../src/lib/i18n";
import "../src/index.css";

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
  parameters: {
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
            padding: "1.5rem",
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
