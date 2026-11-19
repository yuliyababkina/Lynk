import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Heading, Text } from "@/shared/ui/typography";
import { ClickableCard, ClickableCardTrigger } from "./clickable-card";

type Args = { active: boolean; onOpen: () => void };

const meta: Meta<Args> = {
  title: "Custom/Clickable Card",
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
  args: { active: false, onOpen: fn() },
  argTypes: { active: { control: "boolean" } },
  render: ({ active, onOpen }) => (
    <ClickableCard active={active} className="gap-0 px-(--card-spacing) [--card-spacing:1rem]">
      <div className="flex items-center justify-between gap-2">
        <ClickableCardTrigger onClick={onOpen}>
          <Heading level={4} as="span" className="text-primary">
            Schindler AG
          </Heading>
        </ClickableCardTrigger>
        <Badge variant="warning">Action required</Badge>
      </div>
      <Text variant="label" className="mt-1">
        Please confirm your updated bank details
      </Text>
      <p className="mt-2 text-xs text-muted-foreground">Anna Keller · 2 days ago</p>
    </ClickableCard>
  ),
};

export default meta;
type Story = StoryObj<Args>;

/**
 * The trigger's hit area covers the whole card: whatever point of the card is
 * pressed — title, badge, body text, padding — lands on the trigger.
 */
export const Default: Story = {
  play: async ({ userEvent, args, canvasElement }) => {
    const card = canvasElement.querySelector("[data-slot=card]") as HTMLElement;
    const trigger = card.querySelector("button") as HTMLButtonElement;
    const box = card.getBoundingClientRect();
    for (const [x, y] of [
      [0.5, 0.5],
      [0.9, 0.2],
      [0.1, 0.9],
      [0.98, 0.98],
    ]) {
      const hit = document.elementFromPoint(box.left + box.width * x, box.top + box.height * y);
      await expect(trigger.contains(hit)).toBe(true);
    }
    await userEvent.click(trigger);
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};

/** Selected item in a master-detail list. */
export const Active: Story = { args: { active: true } };

/** Tab focuses the trigger, the card shows the focus ring, Enter opens. */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Schindler AG" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};

/** Stat tile: the label is the trigger, the value and hint are context. */
export const StatTile: Story = {
  render: ({ onOpen }) => (
    <ClickableCard className="gap-0 px-(--card-spacing) [--card-spacing:1.25rem]">
      <div className="flex items-center justify-between">
        <ClickableCardTrigger onClick={onOpen}>
          <Text variant="muted" as="span">
            Documents
          </Text>
        </ClickableCardTrigger>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <Text variant="stat" className="mt-2">
        12
      </Text>
      <p className="mt-2 text-xs text-muted-foreground">2 expire this month</p>
    </ClickableCard>
  ),
};
