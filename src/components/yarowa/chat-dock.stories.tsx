import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { I18nProvider } from "@/lib/i18n";
import { LynkDataProvider } from "@/lib/LynkDataContext";
import { Text } from "@/shared/ui/typography";
import { ChatDock } from "./chat-dock";
import type { ChatConversation } from "@/shared/hooks/use-chat-dock";

const CONVERSATION: ChatConversation = {
  relationship: "rel_demo",
  side: "principal",
  author: {
    side: "principal",
    name: "Sabine Müller",
    company: "Urban Habitat Management GmbH",
    role: "Procurement Manager",
  },
  // Quoted on purpose: scripts/check-custom.mjs reads the first `title` property
  // in a story file as the story title, and this must not be mistaken for it.
  "title": "EuroBau Components GmbH",
  subtitle: "Supplier · Berlin",
};

const meta = {
  title: "Custom/Chat Dock",
  component: ChatDock,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  /* The dock is a flex-row sibling of the page: opening it pushes the page aside. */
  decorators: [
    (Story) => (
      <I18nProvider>
        <LynkDataProvider>
          <div className="flex h-[560px]">
            <div className="min-w-0 flex-1 p-6">
              <Text>The page keeps its place and reflows beside the conversation.</Text>
            </div>
            <Story />
          </div>
        </LynkDataProvider>
      </I18nProvider>
    ),
  ],
  args: { conversation: CONVERSATION, onClose: fn() },
} satisfies Meta<typeof ChatDock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

/** The rail collapses in place; nothing inside it can be tabbed into. */
export const Closed: Story = { args: { conversation: null } };

export const ReadOnly: Story = {
  args: {
    conversation: { ...CONVERSATION, readOnlyReason: "This supplier relationship has ended. You can still read the thread." },
  },
};
