import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { DetailDrawer } from "./detail-drawer";
import { Heading, Text } from "@/shared/ui/typography";

const meta = {
  title: "Custom/Detail Drawer",
  component: DetailDrawer,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  /* The rail sits beside the page and pushes it aside, so the story shows both. */
  decorators: [
    (Story) => (
      <div className="flex h-[480px]">
        <div className="min-w-0 flex-1 p-6">
          <Text>The page stays usable while the drawer is open.</Text>
        </div>
        <Story />
      </div>
    ),
  ],
  args: {
    onClose: fn(),
    header: <Heading level={3}>Public Liability Insurance</Heading>,
    children: <Text>Certificate expired on 30 September. A renewed document is needed.</Text>,
  },
} satisfies Meta<typeof DetailDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Long content scrolls inside the rail; the header stays put. */
export const LongContent: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 24 }, (_, i) => (
          <Text key={i}>Activity entry {i + 1}</Text>
        ))}
      </div>
    ),
  },
};

export const WithoutHeader: Story = { args: { header: undefined } };

export const CloseButton: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClose).toHaveBeenCalled();
  },
};
