import type { Meta, StoryObj } from "@storybook/react-vite";
import { CriticalityIcon } from "./criticality-icon";
import type { Criticality } from "@/types";

const LEVELS: Criticality[] = ["critical", "high", "medium", "low"];

const meta = {
  title: "Custom/Criticality Icon",
  component: CriticalityIcon,
  tags: ["ai-generated"],
  args: { criticality: "critical" },
  argTypes: { criticality: { control: "select", options: LEVELS } },
} satisfies Meta<typeof CriticalityIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Critical: Story = {};
export const Low: Story = { args: { criticality: "low" } };
export const Large: Story = { args: { criticality: "high", size: 32 } };

/** Direction encodes rank: up is more urgent. */
export const AllLevels: Story = {
  render: () => (
    <ul className="flex flex-col gap-2">
      {LEVELS.map((level) => (
        <li key={level} className="flex items-center gap-2 text-sm capitalize">
          <CriticalityIcon criticality={level} />
          {level}
        </li>
      ))}
    </ul>
  ),
};
