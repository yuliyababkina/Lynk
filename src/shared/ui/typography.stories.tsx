import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "./typography";

const meta = {
  title: "Foundation/Type Scale",
  component: Heading,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Headings: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1}>Heading 1 — page title (text-2xl bold)</Heading>
      <Heading level={2}>Heading 2 — section heading (text-lg semibold)</Heading>
      <Heading level={3}>Heading 3 — card title (text-base semibold)</Heading>
      <Heading level={4}>Heading 4 — group title (text-sm semibold)</Heading>
    </div>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Text variant="body">Body — the default 14px reading size (text-sm).</Text>
      <Text variant="muted">Muted — secondary body copy (text-sm, muted).</Text>
      <Text variant="small">Small — metadata, captions, helper text (text-xs, muted).</Text>
      <Text variant="label">Label — field and row labels (text-sm medium).</Text>
      <Text variant="eyebrow">Eyebrow — uppercase group label</Text>
      <Text variant="stat" as="div">
        1,284
      </Text>
      <Text variant="mono">Mono — DE45 1203 0000</Text>
    </div>
  ),
};

/** Visual weight and document outline are separate: a level-3 look on an <h2>. */
export const HeadingAsOtherTag: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Heading level={3} as="h2">
        Looks like level 3, is an h2
      </Heading>
      <Heading level={1} as="div">
        Looks like a page title, is a div
      </Heading>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-1">
      <Heading level={1}>Suppliers</Heading>
      <Text variant="small">24 suppliers · last updated today</Text>
      <div className="mt-4 flex flex-col gap-1">
        <Text variant="eyebrow">Open tasks</Text>
        <Text variant="body">Review IBAN change for Urban Habitat Management GmbH</Text>
      </div>
    </div>
  ),
};
