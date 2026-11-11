import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { TabsTriggerWithCount } from "./tabs-trigger-with-count";

const meta = {
  title: "Custom/Tabs With Count",
  component: TabsTriggerWithCount,
  tags: ["ai-generated"],
  args: { value: "all", count: 24, children: "All" },
} satisfies Meta<typeof TabsTriggerWithCount>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Counts, including zero and two- and three-digit values. The first tab is active. */
export const Counts: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTriggerWithCount value="all" count={24}>All</TabsTriggerWithCount>
        <TabsTriggerWithCount value="open" count={6}>Open</TabsTriggerWithCount>
        <TabsTriggerWithCount value="stale" count={0}>Stale</TabsTriggerWithCount>
        <TabsTriggerWithCount value="big" count={248}>Archive</TabsTriggerWithCount>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="open">Open items</TabsContent>
      <TabsContent value="stale">Nothing stale</TabsContent>
      <TabsContent value="big">Archived items</TabsContent>
    </Tabs>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /open/i }));
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Open items");
  },
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTriggerWithCount value="all" count={24}>All</TabsTriggerWithCount>
        <TabsTriggerWithCount value="archived" count={5} disabled>Archived</TabsTriggerWithCount>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
    </Tabs>
  ),
};

/** Long German label: the list scrolls rather than wrapping. */
export const LongGermanLabel: Story = {
  render: () => (
    <div className="max-w-md overflow-x-auto">
      <Tabs defaultValue="endorsed">
        <TabsList>
          <TabsTriggerWithCount value="all" count={12}>Alle Anfragen</TabsTriggerWithCount>
          <TabsTriggerWithCount value="endorsed" count={3}>
            Befürwortet — wartet auf zweite Freigabe
          </TabsTriggerWithCount>
        </TabsList>
        <TabsContent value="all">Alle Anfragen</TabsContent>
        <TabsContent value="endorsed">Befürwortete Anfragen</TabsContent>
      </Tabs>
    </div>
  ),
};
