import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Pill } from "./pill";

const meta = {
  title: "Custom/Pill",
  component: Pill,
  tags: ["ai-generated"],
  args: { children: "All suppliers", onClick: fn() },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking the pill reports the click to its owner, which owns the active state. */
export const Inactive: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /all suppliers/i }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Active: Story = { args: { active: true } };

/** The count renders after the label, dimmed. */
export const WithCount: Story = { args: { active: true, count: 12 } };

export const FilterRow: Story = {
  render: () => (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      <Pill active count={24}>All</Pill>
      <Pill count={6}>Expiring</Pill>
      <Pill count={3}>Blocked</Pill>
    </div>
  ),
};
