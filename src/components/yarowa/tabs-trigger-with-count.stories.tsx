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

/** Long German label: the label truncates and the count badge stays visible
 *  when a single tab is wider than its container. */
export const LongGermanLabel: Story = {
  render: () => (
    <div className="max-w-md">
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

/** Tabs wrap onto the next row when space runs out; they never scroll
 *  sideways. The behaviour lives in `ui/tabs.tsx`; see `UI/Tabs › Wrapping`
 *  for the full set of wrapping stories. */
export const Wrapping: Story = {
  render: () => (
    <div className="w-[320px]">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTriggerWithCount value="all" count={24}>All</TabsTriggerWithCount>
          <TabsTriggerWithCount value="expiring" count={6}>Expiring</TabsTriggerWithCount>
          <TabsTriggerWithCount value="blocked" count={3}>Blocked</TabsTriggerWithCount>
          <TabsTriggerWithCount value="renewal" count={12}>Renewal due</TabsTriggerWithCount>
          <TabsTriggerWithCount value="archived" count={120}>Archived</TabsTriggerWithCount>
        </TabsList>
        <TabsContent value="all">All items</TabsContent>
      </Tabs>
    </div>
  ),
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole("tab");
    const list = canvas.getByRole("tablist");
    await expect(new Set(tabs.map((t) => t.offsetTop)).size).toBeGreaterThanOrEqual(2);
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
  },
};
