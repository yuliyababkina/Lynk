import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { LynkDataProvider } from "@/lib/LynkDataContext";
import type { Ticket } from "@/types";
import { TicketDrawer } from "./ticket-drawer";

/*
 * Stories run on the static mock data (Supabase is off), which holds no
 * documents, contracts, requests or cases a ticket could link to. So these
 * stories cover the panel's skeleton and its two record-less states; each
 * record's body has its own story (Custom/Fact List, Custom/Data Change Body,
 * Custom/Onboarding Application Body), and the status rules are unit-tested in
 * src/lib/ticket-panel.test.ts.
 */
const TICKET: Ticket = {
  id: "ticket_1",
  // Quoted on purpose: scripts/check-custom.mjs reads the first `title` property
  // in a story file as the story title, and this must not be mistaken for it.
  "title": "Insurance Certificate Expired",
  criticality: "critical",
  entityName: "EuroBau Components",
  entityType: "Supplier",
  ageLabel: "2 days",
  primaryAction: "Request Renewal",
  source: "compliance-monitoring",
  category: "Document compliance",
  status: "To do",
};

const meta = {
  title: "Custom/Ticket Drawer",
  component: TicketDrawer,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <LynkDataProvider>
        <div className="flex h-[720px] justify-end">
          <Story />
        </div>
      </LynkDataProvider>
    ),
  ],
  args: {
    ticket: TICKET,
    onClose: fn(),
    onNavigate: fn(),
    onOpenSupplier: fn(),
    onResolve: fn(),
    onReview: fn(),
  },
} satisfies Meta<typeof TicketDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The linked document can't be found: the panel says so, shows no other record, and keeps Escalate. */
export const LinkedRecordNotFound: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(await canvas.findByText(/linked record not found/i)).toBeInTheDocument();
    await expect(canvas.queryByText(/review this item/i)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /escalate/i }));
    await expect(args.onResolve).toHaveBeenCalledWith(args.ticket, "Escalate");
  },
};

/** A profile task has no single record; it keeps its own action as the recommendation. */
export const ProfileTask: Story = {
  args: {
    ticket: {
      ...TICKET,
      id: "ticket_2",
      "title": "Profile completeness 61% — below 65% threshold",
      criticality: "high",
      primaryAction: "Request",
      source: "data-quality",
      category: "Onboarding",
    },
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: /^request$/i }));
    await expect(args.onResolve).toHaveBeenCalledWith(args.ticket, "Request");
  },
};

/** A prospect entity carries a small "Prospect" badge next to its name. */
export const ProspectEntity: Story = {
  args: {
    ticket: {
      ...TICKET,
      id: "ticket_3",
      "title": "Invitation stale — 31 days without response",
      criticality: "high",
      entityName: "Bauer Sanitär GmbH",
      entityType: "Prospect",
      primaryAction: "Remind",
      source: "onboarding",
      category: "Onboarding",
    },
  },
};
