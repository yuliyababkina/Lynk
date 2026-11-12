import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Sidebar } from "./sidebar";

const meta = {
  title: "Custom/Sidebar",
  component: Sidebar,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex h-[640px]">
        <Story />
      </div>
    ),
  ],
  args: { view: "dashboard", onNavigate: fn(), onInvite: fn(), onToggleCollapse: fn() },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The procurement manager's navigation, with the active view marked. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Suppliers" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("suppliers");
  },
};

/** Count badges next to the items that have something waiting. */
export const WithBadges: Story = {
  args: { view: "compliance", badgeCounts: { compliance: 3, onboarding: 12 } },
};

/** Icons only, with the toggle to expand it again. */
export const Collapsed: Story = { args: { collapsed: true } };
