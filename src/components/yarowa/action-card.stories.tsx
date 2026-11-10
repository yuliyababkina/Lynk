import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { FileUp, Send, ShieldAlert, UserCheck } from "lucide-react";
import { ActionCard } from "./action-card";

const meta = {
  title: "Custom/Action Card",
  component: ActionCard,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
  args: {
    tone: "info",
    icon: FileUp,
    title: "Upload a renewal",
    description: "Replace the expired certificate with a new PDF.",
    onClick: fn(),
  },
  argTypes: {
    tone: { control: "select", options: ["warning", "info", "danger", "success", "neutral"] },
  },
} satisfies Meta<typeof ActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /upload a renewal/i }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Warning: Story = {
  args: { tone: "warning", icon: ShieldAlert, title: "Insurance expires in 12 days", description: undefined },
};

export const Danger: Story = {
  args: { tone: "danger", icon: ShieldAlert, title: "Blocked from work orders" },
};

export const Success: Story = {
  args: { tone: "success", icon: UserCheck, title: "Details confirmed", description: "Nothing has changed." },
};

export const Neutral: Story = {
  args: { tone: "neutral", icon: Send, title: "Message the supplier" },
};
