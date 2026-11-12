import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { LanguageToggle } from "./language-toggle";

const meta = {
  title: "Custom/Language Toggle",
  component: LanguageToggle,
  tags: ["ai-generated"],
} satisfies Meta<typeof LanguageToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One click flips the language; the group's own label translates with it. */
export const Light: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("radio", { name: "en" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(canvas.getByRole("radio", { name: "de" }));
    await expect(canvas.getByRole("radio", { name: "de" })).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("group", { name: "Sprache" })).toBeVisible();
  },
};

/** On the brand-navy header. */
export const Dark: Story = {
  args: { tone: "dark" },
  decorators: [
    (Story) => (
      <div className="inline-flex rounded-lg bg-brand-navy p-4">
        <Story />
      </div>
    ),
  ],
};
