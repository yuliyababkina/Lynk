import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { CompactDropzone } from "./compact-dropzone";

const meta = {
  title: "Custom/Compact Dropzone",
  component: CompactDropzone,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
  args: { onFile: fn() },
} satisfies Meta<typeof CompactDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Browsing hands the chosen file to the caller, which owns validation and upload. */
export const Default: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
    await expect(input).not.toBeNull();
    const file = new File(["%PDF-1.4"], "insurance.pdf", { type: "application/pdf" });
    await userEvent.upload(input!, file);
    await expect(args.onFile).toHaveBeenCalledWith(file);
  },
};

export const CustomLabel: Story = { args: { label: "Drop the renewal here" } };

export const Disabled: Story = { args: { disabled: true } };
