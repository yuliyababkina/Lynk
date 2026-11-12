import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { PortalSidebar } from "./portal-sidebar";

const meta = {
  title: "Custom/Portal Sidebar",
  component: PortalSidebar,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex h-[640px]">
        <Story />
      </div>
    ),
  ],
  // An unknown id falls back to the demo supplier profile.
  args: { view: "overview", supplierId: "demo", onNavigate: fn(), onToggleCollapse: fn() },
} satisfies Meta<typeof PortalSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The supplier's six views, with the supplier profile at the foot. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Documents" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("documents");
  },
};

export const OnDocuments: Story = { args: { view: "documents" } };

/** Icons only, with the toggle to expand it again. */
export const Collapsed: Story = { args: { collapsed: true } };
