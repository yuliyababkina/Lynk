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

/** 60-day window: the expiry as a phrase and a reminder — no Revoke. */
export const Warning60: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText("Expires in 42 days · 30 Dec 2026")).toBeInTheDocument();
    await expect(canvas.queryByText(/revoke supplier access/i)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /close/i }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Warning30: Story = {
  args: {
    doc: { ...BASE, status: "warning-30", daysUntilExpiry: 24, autoNotified: "6 Dec 2026" },
  },
};

/** Rejected: Revoke sits apart from the reminder and asks before it runs. */
export const RejectedResubmit: Story = {
  args: {
    doc: {
      ...BASE,
      status: "rejected-resubmit",
      history: [
        ...BASE.history,
        { date: "4 Nov 2026", event: "Rejected — missing signature page", actor: "Sabine Müller", type: "blocked" },
      ],
    },
  },
  play: async ({ canvas, canvasElement, userEvent, args }) => {
    await expect(canvas.getByText(/rejected in review: missing signature page/i)).toBeInTheDocument();
    await userEvent.click(canvas.getByText(/revoke supplier access/i));
    const body = canvasElement.ownerDocument.body;
    await expect(body.querySelector('[role="alertdialog"]')).toBeTruthy();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/** Expired: a reminder only — escalation belongs to the ticket's footer. */
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
