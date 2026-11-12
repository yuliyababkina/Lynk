import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { SupplierDoc } from "@/types";
import { DocumentLightbox } from "./document-lightbox";

const DOC: SupplierDoc = {
  id: "doc-0142",
  supplierId: "sup-eurobau",
  supplierName: "EuroBau Components GmbH",
  trade: "Construction",
  documentName: "Public Liability Insurance",
  documentCategory: "Insurance",
  expiryDate: "30 Sep 2027",
  daysUntilExpiry: -6,
  status: "pending-review",
  history: [],
  renewal: {
    fileName: "PLI-2027-renewal.pdf",
    fileSize: "184 KB",
    uploadedAt: "3 Oct 2026",
    uploadedBy: "Martin Weber",
  },
};

const meta = {
  title: "Custom/Document Lightbox",
  component: DocumentLightbox,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: { doc: DOC, onClose: fn(), onDecision: fn() },
} satisfies Meta<typeof DocumentLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Review the renewal, then accept or reject it. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /accept & replace/i }));
    await expect(args.onDecision).toHaveBeenCalledWith("accept");
  },
};

/** For a blocked supplier the accept button reactivates them. */
export const BlockedSupplier: Story = {
  args: { doc: { ...DOC, status: "blocked" } },
};
