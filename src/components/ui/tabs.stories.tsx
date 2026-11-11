import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain tabs: no counts. */
export const NoCounts: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="closed">Closed</TabsTrigger>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="active">Active items</TabsContent>
      <TabsContent value="closed">Closed items</TabsContent>
    </Tabs>
  ),
};

/** Tabs with a count badge. The badge uses `variant="count"`, which reads on
 *  both the active trigger and the muted list behind inactive ones. */
export const WithCounts: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">
          All <Badge variant="count">24</Badge>
        </TabsTrigger>
        <TabsTrigger value="expiring">
          Expiring <Badge variant="count">6</Badge>
        </TabsTrigger>
        <TabsTrigger value="blocked">
          Blocked <Badge variant="count">3</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="expiring">Expiring items</TabsContent>
      <TabsContent value="blocked">Blocked items</TabsContent>
    </Tabs>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /expiring/i }));
    await expect(canvas.getByRole("tab", { name: /expiring/i })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Expiring items");
  },
};

/** A zero count still renders, so the tab never jumps when it fills up. */
export const ZeroCount: Story = {
  render: () => (
    <Tabs defaultValue="open">
      <TabsList>
        <TabsTrigger value="open">
          Open <Badge variant="count">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="stale">
          Stale <Badge variant="count">0</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="open">Open items</TabsContent>
      <TabsContent value="stale">Nothing stale</TabsContent>
    </Tabs>
  ),
};

/** The badge grows with its digits: 1, 2 and 3 digits side by side. */
export const LargeCounts: Story = {
  render: () => (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">
          One <Badge variant="count">8</Badge>
        </TabsTrigger>
        <TabsTrigger value="two">
          Two <Badge variant="count">48</Badge>
        </TabsTrigger>
        <TabsTrigger value="three">
          Three <Badge variant="count">248</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">One digit</TabsContent>
      <TabsContent value="two">Two digits</TabsContent>
      <TabsContent value="three">Three digits</TabsContent>
    </Tabs>
  ),
};

/** Disabled tabs dim and ignore pointer events; the badge dims with them. */
export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">
          All <Badge variant="count">24</Badge>
        </TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived <Badge variant="count">5</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
    </Tabs>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: /archived/i })).toBeDisabled();
  },
};

/** German labels run long; the list scrolls rather than wrapping or squashing. */
export const LongGermanLabels: Story = {
  render: () => (
    <div className="max-w-md overflow-x-auto">
      <Tabs defaultValue="endorsed">
        <TabsList>
          <TabsTrigger value="all">
            Alle Anfragen <Badge variant="count">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="endorsed">
            Befürwortet — wartet auf zweite Freigabe <Badge variant="count">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Abgelehnt <Badge variant="count">1</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">Alle Anfragen</TabsContent>
        <TabsContent value="endorsed">Befürwortete Anfragen</TabsContent>
        <TabsContent value="rejected">Abgelehnte Anfragen</TabsContent>
      </Tabs>
    </div>
  ),
};
