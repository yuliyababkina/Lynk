import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { RevokeAccessDialog } from "./revoke-access-dialog";

const meta = {
  title: "Custom/Revoke Access Dialog",
  component: RevokeAccessDialog,
  tags: ["ai-generated"],
  args: {
    open: true,
    onOpenChange: fn(),
    supplierName: "Steinbach Bau GmbH",
    onConfirm: fn(),
  },
} satisfies Meta<typeof RevokeAccessDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Confirming revokes; the dialog renders in a portal, so it is found on the page body. */
export const Open: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const body = canvasElement.ownerDocument.body;
    const confirm = Array.from(body.querySelectorAll("button")).find((b) =>
      /revoke supplier access/i.test(b.textContent ?? "")
    );
    await expect(confirm).toBeTruthy();
    await userEvent.click(confirm!);
    await expect(args.onConfirm).toHaveBeenCalled();
  },
};
