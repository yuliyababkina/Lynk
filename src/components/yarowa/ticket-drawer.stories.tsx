import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { LynkDataProvider } from "@/lib/LynkDataContext";
import type { Ticket } from "@/types";
import { TicketDrawer } from "./ticket-drawer";

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
  /* The linked document / contract / request cards come from LynkDataProvider,
     so a ticket whose entity is not in the mock data shows only its header. */
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

/** The primary action resolves the ticket with that action. */
export const DocumentCompliance: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: /request renewal/i }));
    await expect(args.onResolve).toHaveBeenCalledWith(args.ticket, "Request Renewal");
  },
};

/** "Escalate" as the primary action hides the separate Escalate button. */
export const EscalatePrimary: Story = {
  args: { ticket: { ...TICKET, id: "ticket_2", criticality: "high", primaryAction: "Escalate" } },
};

export const Contract: Story = {
  args: {
    ticket: {
      ...TICKET,
      id: "ticket_3",
      "title": "Framework contract up for renewal",
      criticality: "medium",
      primaryAction: "Start Renewal",
      source: "contracts",
      category: "Contracts",
    },
  },
};

export const Onboarding: Story = {
  args: {
    ticket: {
      ...TICKET,
      id: "ticket_4",
      "title": "Onboarding invitation stale",
      criticality: "low",
      entityType: "Prospect",
      primaryAction: "Send Reminder",
      source: "onboarding",
      category: "Onboarding",
    },
  },
};
