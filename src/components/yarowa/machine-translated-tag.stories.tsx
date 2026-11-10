import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { MachineTranslatedTag } from "./machine-translated-tag";

const meta = {
  title: "Custom/Machine Translated Tag",
  component: MachineTranslatedTag,
  tags: ["ai-generated"],
} satisfies Meta<typeof MachineTranslatedTag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The tooltip carries the legal caveat: this is a translation, not the author's words. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTitle(/not the author's original wording/i)).toHaveTextContent(
      "Machine translated"
    );
  },
};

/** Beside the free-form text it qualifies. */
export const NextToContent: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
      <MachineTranslatedTag className="self-start" />
      <p>Please send the renewed liability certificate before the end of the month.</p>
    </div>
  ),
};
