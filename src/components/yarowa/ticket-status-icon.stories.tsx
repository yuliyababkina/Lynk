import type { Meta, StoryObj } from "@storybook/react-vite";
import { TicketStatusIcon } from "./ticket-status-icon";
import type { TicketStatus } from "@/types";

const STATUSES: TicketStatus[] = ["To do", "In progress", "Resolved"];

const meta = {
  title: "Custom/Ticket Status Icon",
  component: TicketStatusIcon,
  tags: ["ai-generated"],
  args: { status: "To do" },
  argTypes: { status: { control: "select", options: STATUSES } },
} satisfies Meta<typeof TicketStatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToDo: Story = {};
export const InProgress: Story = { args: { status: "In progress" } };
export const Resolved: Story = { args: { status: "Resolved" } };

/** The 16px size used in the dropdown rows; 14px is the pill default. */
export const Large: Story = { args: { status: "Resolved", size: 16 } };

/** The glyph is a real hole, so the surface behind the circle shows through it. */
export const AllStatuses: Story = {
  render: () => (
    <ul className="flex flex-col gap-2">
      {STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-sm">
          <TicketStatusIcon status={status} size={16} />
          {status}
        </li>
      ))}
    </ul>
  ),
};
