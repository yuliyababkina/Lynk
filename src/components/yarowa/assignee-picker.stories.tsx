import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";
import { USERS } from "@/data";
import type { User } from "@/types";
import { AssigneePicker } from "./assignee-picker";

const ME = USERS[0]; // Sabine Müller, Procurement North
const TEAMMATE = USERS[1]; // Jonas Becker, Procurement North
const LONG_NAME = USERS.find((u) => u.id === "u-katharina-wiedemann")!; // Katharina Wiedemann-Lechner

const meta = {
  title: "Custom/Assignee Picker",
  component: AssigneePicker,
  tags: ["ai-generated"],
  args: { assignee: ME, currentUser: ME, users: USERS, onChange: fn() },
  argTypes: { variant: { control: "inline-radio", options: ["avatar", "field"] } },
} satisfies Meta<typeof AssigneePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Already mine: "Assign to me" is hidden and my name carries the check. */
export const AssignedToMe: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /currently sabine müller/i }));
    await expect(await screen.findByRole("option", { name: /unassigned/i })).toBeInTheDocument();
    await expect(screen.queryByRole("option", { name: /assign to me/i })).not.toBeInTheDocument();
  },
};

/** Someone else's task: "Assign to me" takes it over. */
export const AssignedToSomeoneElse: Story = {
  args: { assignee: TEAMMATE },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /currently jonas becker/i }));
    await userEvent.click(await screen.findByRole("option", { name: /assign to me/i }));
    await expect(args.onChange).toHaveBeenCalledWith(ME.id);
  },
};

/** Nobody owns it: dashed avatar with a person-plus icon. */
export const Unassigned: Story = { args: { assignee: null } };

/** Resolved tasks show who did it, without the picker. */
export const ReadOnly: Story = { args: { assignee: TEAMMATE, readOnly: true } };

/** The drawer's value: avatar, name and team. */
export const Field: Story = { args: { assignee: TEAMMATE, variant: "field" } };

export const FieldUnassigned: Story = { args: { assignee: null, variant: "field" } };

/** Long German double-barrelled names must truncate, not push the layout. */
export const LongGermanName: Story = {
  args: { assignee: LONG_NAME, variant: "field" },
  decorators: [(Story) => <div className="w-[220px]"><Story /></div>],
};

/** Search narrows the team-grouped list. */
export const Search: Story = {
  args: { assignee: null },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /currently unassigned/i }));
    await userEvent.type(await screen.findByRole("combobox"), "Schäfer");
    await userEvent.click(await screen.findByRole("option", { name: /maximilian/i }));
    await expect(args.onChange).toHaveBeenCalledWith("u-maximilian-schaefer");
  },
};

function Stateful() {
  const [assignee, setAssignee] = useState<User | null>(null);
  return (
    <div className="flex items-center gap-6">
      <AssigneePicker
        assignee={assignee}
        currentUser={ME}
        users={USERS}
        onChange={(id) => setAssignee(USERS.find((u) => u.id === id) ?? null)}
      />
      <AssigneePicker
        variant="field"
        assignee={assignee}
        currentUser={ME}
        users={USERS}
        onChange={(id) => setAssignee(USERS.find((u) => u.id === id) ?? null)}
      />
    </div>
  );
}

/** Row avatar and drawer field share one value, as on the Task Queue. */
export const Interactive: Story = { render: () => <Stateful /> };
