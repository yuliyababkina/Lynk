import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { WizardStepper } from "./wizard-stepper";

const STEPS = ["Upload", "Preview", "Details", "Distribution"];

const meta = {
  title: "Product Components/Wizard Stepper",
  component: WizardStepper,
  tags: ["autodocs"],
  args: { steps: STEPS, current: "Preview", onStepClick: fn() },
  argTypes: {
    current: { control: "select", options: STEPS },
  },
} satisfies Meta<typeof WizardStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-flow: first two steps complete, "Details" not yet reached. */
export const Default: Story = { args: { current: "Details" } };

/** First step active — nothing completed yet (edge case). */
export const FirstStep: Story = { args: { current: "Upload" } };

/** Final step — every prior step shows a completed check (edge case). */
export const LastStep: Story = { args: { current: "Distribution" } };

/** Read-only: no onStepClick, so steps aren't navigable. */
export const NotClickable: Story = { args: { current: "Preview", onStepClick: undefined } };
