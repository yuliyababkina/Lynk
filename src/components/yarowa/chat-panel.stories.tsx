import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { I18nProvider } from "@/lib/i18n";
import { ChatPanel } from "./chat-panel";
import type { ChatMessage } from "@/types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const THREAD: ChatMessage[] = [
  {
    id: "1",
    relationshipId: "rel_demo",
    authorSide: "system",
    authorName: "Lynk",
    authorCompany: "Urban Habitat Management GmbH",
    body: "Sabine Müller invited EuroBau Components GmbH to onboard with Urban Habitat Management GmbH.",
    createdAt: hoursAgo(60),
  },
  {
    id: "2",
    relationshipId: "rel_demo",
    authorSide: "principal",
    authorName: "Sabine Müller",
    authorCompany: "Urban Habitat Management GmbH",
    authorRole: "Procurement Manager",
    body: "Your Public Liability Insurance expired last week, so you're blocked from new work orders until a renewed certificate is on file.",
    context: { type: "document", id: "doc-pli", label: "Public Liability Insurance" },
    createdAt: hoursAgo(52),
  },
  {
    id: "3",
    relationshipId: "rel_demo",
    authorSide: "supplier",
    authorName: "Martin Weber",
    authorCompany: "EuroBau Components GmbH",
    authorRole: "Supplier Manager",
    body: "Thanks — our broker issues the new policy on Monday. I'll upload it the same day.",
    createdAt: hoursAgo(2),
  },
];

const meta = {
  title: "Product Components/Chat Panel",
  component: ChatPanel,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <I18nProvider>
        <div className="h-[560px] w-[420px] rounded-lg border border-border bg-card">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
  args: {
    messages: THREAD,
    side: "supplier",
    title: "Urban Habitat Management GmbH",
    subtitle: "Supplier · since 2024",
    onSend: fn(),
    onOpenContext: fn(),
    className: "h-full",
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The supplier's view: their own messages right, the principal's left. */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Write a message"), "Uploaded just now.");
    await userEvent.click(canvas.getByRole("button", { name: "Send" }));
    await expect(args.onSend).toHaveBeenCalledWith("Uploaded just now.", undefined);
  },
};

/** The same thread read by procurement — alignment flips, nothing else does. */
export const PrincipalSide: Story = {
  args: { side: "principal", title: "EuroBau Components GmbH", subtitle: "Supplier · Berlin" },
};

/** A context chip navigates to the document; it never acts on it. */
export const ContextLink: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getAllByTitle("Open document")[0]);
    await expect(args.onOpenContext).toHaveBeenCalledWith(
      expect.objectContaining({ type: "document", id: "doc-pli" })
    );
  },
};

/** Rejected or inactive relationship: history stays, the composer goes. */
export const ReadOnly: Story = {
  args: {
    readOnlyReason:
      "This application was not approved, so the conversation is closed. It stays here for your records.",
  },
};

/** Opened from a ticket's Chat button — the item is already linked. */
export const WithPrefilledDraft: Story = {
  args: {
    draft: "About the expiring certificate — ",
    draftContext: { type: "document", id: "doc-pli", label: "Public Liability Insurance" },
  },
};

/** First contact (edge case). */
export const Empty: Story = { args: { messages: [] } };

/** An author who has left the company still renders, marked inactive. */
export const InactiveAuthor: Story = {
  args: {
    messages: [{ ...THREAD[1], authorInactive: true }],
  },
};
