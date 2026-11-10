import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { RenewalReviewCard } from "./renewal-review-card";
import type { SupplierDoc } from "@/types";

const DOC: SupplierDoc = {
  id: "doc-pli",
  supplierId: "sup-eurobau",
  supplierName: "EuroBau Components GmbH",
  trade: "Construction",
  documentName: "Public Liability Insurance",
  documentCategory: "Insurance",
  expiryDate: "30 Sep 2026",
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
  title: "Custom/Renewal Review Card",
  component: RenewalReviewCard,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
  args: { doc: DOC, onReview: fn() },
} satisfies Meta<typeof RenewalReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both the file row and the Review button open the same lightbox. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText(/184 KB · Uploaded 3 Oct 2026/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /review document/i }));
    await userEvent.click(canvas.getByRole("button", { name: /PLI-2027-renewal\.pdf/ }));
    await expect(args.onReview).toHaveBeenCalledTimes(2);
  },
};

/** No renewal on file: the card renders nothing. */
export const NoRenewal: Story = {
  args: { doc: { ...DOC, renewal: undefined } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
