import type { Meta, StoryObj } from "@storybook/react-vite";
import { FactList } from "./fact-list";

const meta = {
  title: "Custom/Fact List",
  component: FactList,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[348px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FactList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A document in its 30-day window. */
export const Document: Story = {
  args: {
    facts: [
      { label: "Document expires", value: "Expires in 23 days · 2 Aug 2026" },
      { label: "Supplier auto-notified", value: "3 Jul 2026" },
    ],
  },
};

/** A passed date reads in the critical ink. */
export const Blocked: Story = {
  args: {
    facts: [
      { label: "Document expired", value: "Expired 3 days ago · 7 Jul 2026", tone: "danger" },
      { label: "Supplier blocked since", value: "07 Jul 2026" },
    ],
  },
};

/** Long values wrap rather than truncate. */
export const Contract: Story = {
  args: {
    facts: [
      { label: "Contract ends", value: "Ends in 8 days · 18 Jul 2026", tone: "danger" },
      { label: "Renewal decision due", value: "Was due 82 days ago · 19 Apr 2026", tone: "danger" },
      { label: "Annual value", value: "€265,000 per year" },
      { label: "Notice period", value: "90d" },
    ],
  },
};
