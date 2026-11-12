import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";
import type { TicketStatus } from "@/types";
import { TicketStatusMenu } from "./ticket-status-menu";

const meta = {
  title: "Custom/Ticket Status Menu",
  component: TicketStatusMenu,
  tags: ["ai-generated"],
  args: { status: "To do", onChange: fn() },
  argTypes: { status: { control: "select", options: ["To do", "In progress", "Resolved"] } },
} satisfies Meta<typeof TicketStatusMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Picking another status reports it; the current one is marked and does nothing. */
export const ToDo: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /to do/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /in progress/i }));
    await expect(args.onChange).toHaveBeenCalledWith("In progress");
  },
};

export const InProgress: Story = { args: { status: "In progress" } };

export const Resolved: Story = { args: { status: "Resolved" } };

function Stateful() {
  const [status, setStatus] = useState<TicketStatus>("To do");
  return <TicketStatusMenu status={status} onChange={setStatus} />;
}

/** Wired to state, so the pill follows the choice. */
export const Interactive: Story = { render: () => <Stateful /> };
