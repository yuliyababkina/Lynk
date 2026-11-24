import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ProspectDecisionActions } from "./prospect-decision-actions";

const meta = {
  title: "Custom/Prospect Decision Actions",
  component: ProspectDecisionActions,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[348px]">
        <Story />
      </div>
    ),
  ],
  args: {
    companyName: "Bauer Sanitär GmbH",
    onDecide: fn(async () => {}),
  },
} satisfies Meta<typeof ProspectDecisionActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every document in: Accept is the recommendation; Reject sits apart. */
export const ReadyForReview: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /accept application/i }));
    await expect(args.onDecide).toHaveBeenCalledWith("accept", undefined);
  },
};

/** Documents missing or rejected: no Accept, only changes or rejection. */
export const DocumentsMissing: Story = {
  args: { canAccept: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /accept application/i })).not.toBeInTheDocument();
  },
};

/** Request changes asks for a note before anything is sent. */
export const RequestChanges: Story = {
  play: async ({ canvas, canvasElement, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /request changes/i }));
    const body = canvasElement.ownerDocument.body;
    const send = Array.from(body.querySelectorAll("button")).find((b) => /send feedback/i.test(b.textContent ?? ""));
    await expect(send).toBeDisabled();
    await userEvent.type(body.querySelector("textarea")!, "Please upload the bank confirmation letter.");
    await userEvent.click(send!);
    await expect(args.onDecide).toHaveBeenCalledWith("changes", "Please upload the bank confirmation letter.");
  },
};
