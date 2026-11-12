import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Button } from "@/components/ui/button";
import { WizardFooter } from "./wizard-footer";

const meta = {
  title: "Custom/Wizard Footer",
  component: WizardFooter,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
  args: {
    onBack: fn(),
    children: <Button>Next</Button>,
  },
} satisfies Meta<typeof WizardFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Back on the left with its arrow, the primary action on the right. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /back/i }));
    await expect(args.onBack).toHaveBeenCalledTimes(1);
  },
};

/** Draft and publish side by side, as on the last catalogue step. */
export const TwoActions: Story = {
  args: {
    children: (
      <div className="flex gap-2">
        <Button variant="outline">Save as draft</Button>
        <Button>Publish &amp; share with suppliers</Button>
      </div>
    ),
  },
};

/** The first step has no Back; the primary still snaps to the right. */
export const NoBack: Story = {
  args: { onBack: undefined },
};

/** The Back label is passed as English source and translated on the way out. */
export const LongBackLabel: Story = {
  args: { backLabel: "Back to the compliance documents" },
};
