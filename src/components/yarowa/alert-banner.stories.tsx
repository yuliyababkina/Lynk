import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { AlertBanner } from "./alert-banner";

const meta = {
  title: "Product Components/Alert Banner",
  component: AlertBanner,
  tags: ["autodocs"],
  args: {
    title: "1 critical payment data change awaiting review",
    children:
      "IBAN and banking changes carry the highest fraud risk. Review carefully before endorsing.",
  },
  argTypes: {
    type: { control: "select", options: ["error", "warning", "info", "success", "neutral"] },
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = { args: { type: "error" } };
export const Warning: Story = {
  args: { type: "warning", title: "1 supplier blocked from work orders" },
};
export const Info: Story = { args: { type: "info", title: "3 documents pending review" } };
export const Success: Story = { args: { type: "success", title: "All suppliers compliant" } };
export const Neutral: Story = { args: { type: "neutral", title: "Nothing needs attention" } };

/** Title only, no body text. */
export const TitleOnly: Story = { args: { children: undefined } };

/**
 * The project's single CssCheck: asserts the error banner's background resolves
 * to its --alert-error-bg token (#fecaca → rgb(254, 202, 202)). If the theme
 * CSS failed to load in Storybook, this fails instead of silently rendering unstyled.
 */
export const CssCheck: Story = {
  args: { type: "error" },
  play: async ({ canvas }) => {
    const banner = canvas.getByRole("alert");
    await expect(getComputedStyle(banner).backgroundColor).toBe("rgb(254, 202, 202)");
  },
};
