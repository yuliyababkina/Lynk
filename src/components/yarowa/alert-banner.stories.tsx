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
 * The project's single CssCheck: proves the theme CSS actually loaded, rather
 * than the banner rendering unstyled.
 *
 * It asserts a *property* of the resolved colour — tinted, not transparent, and
 * red rather than any other hue — instead of one literal triple. The old version
 * hard-coded rgb(254, 202, 202); it broke the day the token moved to
 * color-mix(), which Chromium reports as color(srgb …), and would break again on
 * any palette tweak. Those are theme changes, not regressions.
 */
export const CssCheck: Story = {
  args: { type: "error" },
  play: async ({ canvas }) => {
    const banner = canvas.getByRole("alert");
    const bg = getComputedStyle(banner).backgroundColor;

    // Normalise whatever colour syntax the browser reports into rgb channels.
    const probe = document.createElement("canvas");
    const ctx = probe.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

    await expect(a).toBeGreaterThan(0); // styled at all, not transparent
    await expect(r).toBeGreaterThan(g); // warm, not neutral or cool
    await expect(r).toBeGreaterThan(b);
    await expect(r).toBeGreaterThan(200); // a soft tint, not the solid colour
  },
};
