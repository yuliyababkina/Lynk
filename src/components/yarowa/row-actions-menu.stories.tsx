import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";
import { Archive, Pencil, Trash2 } from "lucide-react";
import { Text } from "@/shared/ui/typography";
import { RowActionsMenu } from "./row-actions-menu";

const meta = {
  title: "Custom/Row Actions Menu",
  component: RowActionsMenu,
  tags: ["ai-generated"],
  // The menu hides until its row is hovered, so a story gives it a `group` row.
  decorators: [
    (Story) => (
      <div className="group flex w-[420px] items-center justify-between rounded-lg border border-border px-4 py-3">
        <Text variant="label" as="span">
          Urban Habitat Management GmbH
        </Text>
        <Story />
      </div>
    ),
  ],
  args: {
    actions: [
      { label: "Edit", icon: <Pencil />, onSelect: fn() },
      { label: "Archive", icon: <Archive />, onSelect: fn() },
      { label: "Delete", icon: <Trash2 />, onSelect: fn(), destructive: true },
    ],
  },
} satisfies Meta<typeof RowActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens on click; picking an item runs its action and closes the menu. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Row actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Archive" }));
    await expect(args.actions[1].onSelect).toHaveBeenCalledTimes(1);
  },
};

/** The destructive item is tinted; the menu stays open for a look. */
export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Row actions" }));
    await expect(await screen.findByRole("menuitem", { name: "Delete" })).toBeVisible();
  },
};

/** Without actions there is nothing to show. */
export const NoActions: Story = { args: { actions: [] } };
