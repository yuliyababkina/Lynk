import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { SupplierDoc } from "@/types";
import { DocumentViewer } from "./document-viewer";
import sampleUrl from "../../../supabase/mock-documents/yilmaz/Public_Liability_Insurance.pdf?url";

const DOC: SupplierDoc = {
  id: "doc-pli",
  supplierId: "sup-eurobau",
  supplierName: "EuroBau Components GmbH",
  trade: "Construction",
  documentName: "Public Liability Insurance",
  documentCategory: "Insurance",
  expiryDate: "30 Sep 2027",
  daysUntilExpiry: 322,
  status: "valid",
  history: [],
  fileUrl: sampleUrl,
};

const meta = {
  title: "Custom/Document Viewer",
  component: DocumentViewer,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: { doc: DOC, onClose: fn() },
} satisfies Meta<typeof DocumentViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full-screen preview at 100%; Escape or the close button dismisses it. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Close" }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
