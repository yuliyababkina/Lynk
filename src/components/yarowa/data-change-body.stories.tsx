import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DataGovernanceRequest } from "@/types";
import { DataChangeBody } from "./data-change-body";

const REQUEST: DataGovernanceRequest = {
  id: "dgr-1",
  supplierName: "BauParts GmbH",
  category: "Payment Data",
  risk: "Critical",
  requestedBy: "Laura Heinz",
  requestedAt: "18 Jun 2026, 09:14",
  reason: "Company bank account migrated to DKB following merger with Bau Group Holding.",
  fields: [
    { label: "IBAN", before: "•••• •••• •••• •••• 130 00", after: "DE45 1203 0000 1020 3040 50", sensitive: true },
    { label: "Bank Name", before: "Commerzbank AG", after: "Deutsche Kreditbank AG" },
    { label: "BIC / SWIFT", before: "COBADEFFXXX", after: "BELADEBEXXX" },
  ],
  status: "Awaiting Review",
  approvalStep: 1,
};

const meta = {
  title: "Custom/Data Change Body",
  component: DataChangeBody,
  tags: ["ai-generated"],
  args: { request: REQUEST },
} satisfies Meta<typeof DataChangeBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Data Governance card: Before and After side by side. */
export const Split: Story = {
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
};

/** The 380px ticket panel: After stacked under Before. */
export const Stacked: Story = {
  args: { layout: "stacked" },
  decorators: [
    (Story) => (
      <div className="w-[348px]">
        <Story />
      </div>
    ),
  ],
};

/** First review done, waiting on the second approver. */
export const Endorsed: Story = {
  ...Stacked,
  args: { layout: "stacked", request: { ...REQUEST, status: "Endorsed — Awaiting 2nd Approval", approvalStep: 2 } },
};

/** Both steps done. */
export const Approved: Story = {
  ...Stacked,
  args: { layout: "stacked", request: { ...REQUEST, status: "Approved", approvalStep: 2 } },
};
