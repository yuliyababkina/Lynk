import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CircleAlert, Info } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

const meta = {
  component: Alert,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
  argTypes: { variant: { control: "select", options: ["default", "destructive"] } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Documents pending review</AlertTitle>
      <AlertDescription>Three uploads are waiting for a procurement manager.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <CircleAlert />
      <AlertTitle>Upload failed</AlertTitle>
      <AlertDescription>The file is larger than 10 MB. Choose a smaller PDF.</AlertDescription>
    </Alert>
  ),
};

/** The action is pinned top right and reserves its own padding. */
export const WithAction: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Supplier removed</AlertTitle>
      <AlertDescription>Farbwerk Berlin no longer appears in the pipeline.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Undo
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toContainElement(
      canvas.getByRole("button", { name: /undo/i })
    );
  },
};
