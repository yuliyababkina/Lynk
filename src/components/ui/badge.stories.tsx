import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Badge" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** shadcn variants plus the Lynk semantic tones (criticality + status),
 *  each using the WCAG-AA soft/ink token pairs. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(
        [
          "default",
          "secondary",
          "outline",
          "critical",
          "high",
          "medium",
          "low",
          "success",
          "warning",
          "info",
          "danger",
          "purple",
          "neutral",
          "dark",
        ] as const
      ).map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
