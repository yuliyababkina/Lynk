import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";
import type { ChatMessage } from "@/types";
import { NotificationBell, type BellEntry } from "./notification-bell";

const message = (over: Partial<ChatMessage>): ChatMessage => ({
  id: "m1",
  relationshipId: "rel_demo",
  authorSide: "supplier",
  authorName: "Jonas Becker",
  authorCompany: "EuroBau Components GmbH",
  body: "I uploaded the renewed liability certificate, can you take a look?",
  createdAt: "2026-11-11T09:30:00Z",
  ...over,
});

// `"title"` is quoted on purpose: scripts/check-custom.mjs takes the first `title`
// property in a story file as the story title, and these are not it.
const ENTRIES: BellEntry[] = [
  {
    relationship: "rel_eurobau",
    "title": "EuroBau Components GmbH",
    count: 3,
    latest: message({ context: { type: "document", id: "doc_1", label: "Liability insurance" } }),
  },
  {
    relationship: "rel_novak",
    "title": "Novak Installationstechnik",
    count: 1,
    latest: message({ id: "m2", authorName: "Petra Novak", body: "Our VAT ID changed in March." }),
  },
];

const meta = {
  title: "Custom/Notification Bell",
  component: NotificationBell,
  tags: ["ai-generated"],
  decorators: [
    (Story) => (
      <div className="flex justify-end p-4">
        <Story />
      </div>
    ),
  ],
  args: { entries: ENTRIES, onOpen: fn() },
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One entry per conversation with unread messages; picking one hands the conversation back. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /4 new messages/i }));
    await userEvent.click(await screen.findByRole("button", { name: /novak installationstechnik/i }));
    await expect(args.onOpen).toHaveBeenCalledWith("rel_novak");
  },
};

/** Left open for a look at the list. */
export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /4 new messages/i }));
    await expect(await screen.findByText("Messages")).toBeVisible();
  },
};

/** Nothing unread: no badge, and an empty note in the panel. */
export const Empty: Story = { args: { entries: [] } };

/** Counts above nine collapse to 9+. */
export const ManyUnread: Story = {
  args: { entries: [{ ...ENTRIES[0], count: 14 }, ENTRIES[1]] },
};

/** On a brand-navy surface. */
export const Dark: Story = {
  args: { tone: "dark" },
  decorators: [
    (Story) => (
      <div className="inline-flex rounded-lg bg-brand-navy p-3">
        <Story />
      </div>
    ),
  ],
};
