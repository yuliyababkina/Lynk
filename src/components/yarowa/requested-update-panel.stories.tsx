import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { RequestedUpdatePanel } from "./requested-update-panel";
import type { RequestedUpdate } from "@/pages/portal/portal-data";

const UPDATE: RequestedUpdate = {
  id: "ru-1",
  from: "Sabine Müller",
  principal: "Urban Habitat Management GmbH",
  email: "sabine.mueller@urban-habitat.example",
  sentLabel: "2 days ago",
  subject: "Please confirm your current insurance details",
  body: [
    "We are updating our supplier records for the coming year.",
    "Please confirm that your liability insurance details are still correct, or send us the changes.",
  ],
  dueLabel: "Due in 5 days",
};

const meta = {
  title: "Custom/Requested Update Panel",
  component: RequestedUpdatePanel,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
  args: { update: UPDATE },
} satisfies Meta<typeof RequestedUpdatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The principal's subject and body render as authored; only the card chrome translates. */
export const Default: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("heading", { name: args.update.subject })).toBeVisible();
    for (const paragraph of args.update.body) {
      await expect(canvas.getByText(paragraph)).toBeVisible();
    }
    await expect(canvas.getByRole("button", { name: /review & update my details/i })).toBeEnabled();
  },
};

export const SingleParagraph: Story = {
  args: {
    update: {
      ...UPDATE,
      subject: "Bank details check",
      body: ["Please confirm your IBAN is unchanged."],
      dueLabel: "Due tomorrow",
    },
  },
};
