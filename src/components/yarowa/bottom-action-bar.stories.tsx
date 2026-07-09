import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BottomActionBar } from "./bottom-action-bar";

const meta = {
  title: "Product Components/Bottom Action Bar",
  component: BottomActionBar,
  tags: ["autodocs"],
  args: { onBack: fn(), onSaveDraft: fn(), onPrimary: fn() },
  parameters: { layout: "padded" },
} satisfies Meta<typeof BottomActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-wizard footer: Back + Next. */
export const Default: Story = { args: { primaryLabel: "Next" } };

/** Final step of the create flow: Back / Save as draft / Publish & share. */
export const CreatePublish: Story = {
  args: { showSaveDraft: true, primaryLabel: "Publish & share with suppliers" },
};

/** Final step of the update flow: no draft option, notify label. */
export const UpdatePublish: Story = {
  args: { showSaveDraft: false, primaryLabel: "Publish & notify suppliers" },
};

/** First step — no Back button (edge case). */
export const NoBack: Story = { args: { showBack: false, primaryLabel: "Next" } };

/** Primary disabled — e.g. nothing selected to publish (edge case). */
export const PrimaryDisabled: Story = {
  args: { showSaveDraft: true, primaryLabel: "Publish & share with suppliers", primaryDisabled: true },
};
