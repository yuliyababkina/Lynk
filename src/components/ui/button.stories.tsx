import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All variants, including the Lynk-added solid `danger` and `success`. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default", "outline", "secondary", "ghost", "destructive", "danger", "success", "link"] as const).map(
        (v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        )
      )}
    </div>
  ),
};
