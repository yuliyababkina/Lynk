import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { DocumentMetadataForm } from "./document-metadata-form";

const meta = {
  title: "Custom/Document Metadata Form",
  component: DocumentMetadataForm,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
  args: {
    fileName: "PLI-2027-renewal.pdf",
    documentName: "Public Liability Insurance",
    initial: {
      documentType: "Insurance Policy",
      issuingInstitution: "Allianz",
      expiryDate: "2027-09-30",
      doesNotExpire: false,
    },
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof DocumentMetadataForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pre-filled after a file is picked; confirming hands back the reviewed values. */
export const Upload: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /confirm & upload/i }));
    await expect(args.onConfirm).toHaveBeenCalledWith(args.initial);
  },
};

/** Correcting a document already on file: no file row, "Save details". */
export const Edit: Story = { args: { mode: "edit", fileName: undefined } };

/** Nothing recognised: the confirm button stays disabled with a hint below. */
export const Incomplete: Story = {
  args: {
    initial: { documentType: "", issuingInstitution: "", expiryDate: "", doesNotExpire: false },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /confirm & upload/i })).toBeDisabled();
  },
};

/** The document names a period, not a day — the form asks for the exact date. */
export const ExpiryHint: Story = {
  args: {
    expiryHint: "valid for 12 months from issue",
    initial: { documentType: "Certificate", issuingInstitution: "TÜV Süd", expiryDate: "", doesNotExpire: false },
  },
};

export const Busy: Story = { args: { busy: true } };
