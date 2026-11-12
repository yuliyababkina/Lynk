import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopHeader } from "./top-header";

const meta = {
  title: "Custom/Top Header",
  component: TopHeader,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: { currentLabel: "Dashboard", onSwitchAccount: fn() },
} satisfies Meta<typeof TopHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The current page, the language switch, and the account switch with initials. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Switch" }));
    await expect(args.onSwitchAccount).toHaveBeenCalledTimes(1);
  },
};

/** Inside the platform shell, which owns the language switch. */
export const NoLanguage: Story = { args: { showLanguage: false } };

/** A leading control (a menu button) and a trailing one (the notification bell). */
export const WithLeadingAndTrailing: Story = {
  args: {
    currentLabel: "Task Queue",
    accountInitials: "AK",
    leading: (
      <Button variant="ghost" size="icon-sm" aria-label="Menu">
        <Menu />
      </Button>
    ),
    trailing: (
      <Button variant="ghost" size="icon-sm" aria-label="Notifications">
        <Bell />
      </Button>
    ),
  },
};

/** No account switching, e.g. a single-account session. */
export const NoAccountSwitch: Story = { args: { onSwitchAccount: undefined } };
