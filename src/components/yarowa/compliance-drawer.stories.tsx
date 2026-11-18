import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { SupplierDoc } from "@/types";
import { ComplianceDrawer } from "./compliance-drawer";

const BASE: SupplierDoc = {
  id: "doc-pli",
  supplierId: "sup-eurobau",
  supplierName: "EuroBau Components GmbH",
  trade: "Construction",
  documentName: "Public Liability Insurance",
  documentCategory: "Insurance",
  expiryDate: "30 Dec 2026",
  daysUntilExpiry: 42,
  status: "warning-60",
  history: [
    { date: "2 Jan 2026", event: "Document verified", actor: "System", type: "verified" },
    { date: "1 Nov 2026", event: "60-day warning triggered", actor: "System", type: "warning" },
  ],
};

const meta = {
  title: "Custom/Compliance Drawer",
  component: ComplianceDrawer,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="flex h-[680px] justify-end">
        <Story />
      </div>
    ),
  ],
  args: { doc: BASE, onClose: fn(), onReview: fn() },
} satisfies Meta<typeof ComplianceDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 60-day window: a recommendation plus the two follow-up actions. */
export const Warning60: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText("Days remaining")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /close/i }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Warning30: Story = {
  args: {
    doc: { ...BASE, status: "warning-30", daysUntilExpiry: 24, autoNotified: "6 Dec 2026" },
  },
};

/** Expired: the second action becomes "Escalate to Manager". */
export const Blocked: Story = {
  args: {
    doc: {
      ...BASE,
      status: "blocked",
      daysUntilExpiry: -6,
      statusNote: "Document expired. Supplier blocked from new work orders.",
    },
  },
};

/** A renewal is waiting: the review card replaces the action list. */
export const PendingReview: Story = {
  args: {
    doc: {
      ...BASE,
      status: "pending-review",
      daysUntilExpiry: -6,
      statusNote: "Renewal uploaded and awaiting review.",
      renewal: {
        fileName: "PLI-2027-renewal.pdf",
        fileSize: "184 KB",
        uploadedAt: "3 Oct 2026",
        uploadedBy: "Martin Weber",
      },
    },
  },
};

export const Valid: Story = {
  args: {
    doc: { ...BASE, status: "valid", daysUntilExpiry: 320, statusNote: "Verified and in date." },
  },
};
