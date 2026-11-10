import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskGroupCard, TaskRow } from "./task-group-card";

const onOpen = fn();

const meta = {
  title: "Custom/Task Group Card",
  component: TaskGroupCard,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Needs review",
    count: 2,
    icon: <FileWarning size={14} aria-hidden="true" />,
    children: null,
  },
  render: (args) => (
    <TaskGroupCard {...args}>
      <TaskRow
        title="Public Liability Insurance expired"
        subline="EuroBau Components GmbH · expired 6 days ago"
        status={<Badge variant="critical-outline">Critical</Badge>}
        action={<Button size="sm">Review</Button>}
        onClick={onOpen}
      />
      <TaskRow
        title="Bank details changed"
        subline="Maler Rhein GmbH · requested yesterday"
        status={<Badge variant="outline">To do</Badge>}
        muted
      />
    </TaskGroupCard>
  ),
} satisfies Meta<typeof TaskGroupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An interactive row is a button: it opens on click and on Enter. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    onOpen.mockClear();
    const row = canvas.getByRole("button", { name: /public liability insurance expired/i });
    await userEvent.click(row);
    await expect(onOpen).toHaveBeenCalledTimes(1);
    row.focus();
    await userEvent.keyboard("{Enter}");
    await expect(onOpen).toHaveBeenCalledTimes(2);
  },
};

export const SingleRow: Story = {
  args: { label: "Resolved", count: 1 },
  render: (args) => (
    <TaskGroupCard {...args}>
      <TaskRow title="Tax certificate renewed" subline="Farbwerk Berlin" muted />
    </TaskGroupCard>
  ),
};
