import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge } from "./badge";
import { Input } from "./input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "**Tabs wrap instead of scrolling.** When the row runs out of horizontal space, the tabs that don't fit move onto the next row. The row never scrolls sideways, so every tab stays visible and reachable. Both the `default` and the `line` variant wrap. See `Wrapping` and `WrappingLineVariant` below.",
          "**Long labels truncate, the count badge stays.** A tab keeps its natural width. If a single tab is wider than its container, the label is cut with an ellipsis (wrap it in `<span className=\"truncate\">`; `TabsTriggerWithCount` already does) and the count badge stays visible. See `WrappingLongGermanLabel`.",
          "**Vertical orientation is unchanged.** `orientation=\"vertical\"` keeps its stacked column.",
          "**Don't wrap `TabsList` in `overflow-x-auto`.** The list manages its own overflow, and a scroll container around it hides the wrapped rows and clips the focus ring. In a row with other controls (a search field, a button), give the row `flex-wrap` and the `TabsList` `min-w-0`, so the control drops below the tabs instead of squeezing them. See `WrappingInToolbar`.",
        ].join("\n\n"),
      },
    },
  },
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

const WRAP_TABS = [
  { value: "all", label: "All", count: 24 },
  { value: "expiring", label: "Expiring", count: 6 },
  { value: "blocked", label: "Blocked", count: 3 },
  { value: "renewal", label: "Renewal due", count: 12 },
  { value: "onboarding", label: "Onboarding", count: 8 },
  { value: "review", label: "In review", count: 15 },
  { value: "archived", label: "Archived", count: 120 },
  { value: "drafts", label: "Drafts", count: 2 },
] as const;

/** Eight tabs with counts, shared by the wrapping stories. */
function WrappingTabs({
  variant,
  disabledValue,
}: {
  variant?: "default" | "line";
  disabledValue?: string;
}) {
  return (
    <Tabs defaultValue="all">
      <TabsList variant={variant}>
        {WRAP_TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value} disabled={t.value === disabledValue}>
            {t.label} <Badge variant="count">{t.count}</Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {WRAP_TABS.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {t.label} items
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** The distinct row positions of a set of tabs: one entry per visual row. */
const rowTops = (tabs: HTMLElement[]) => [...new Set(tabs.map((t) => t.offsetTop))];

/** Eight tabs in a 480px container. They don't fit on one row, so the rest move
 *  onto the next row. The list never scrolls sideways. `ArrowRight` on the last
 *  tab of row 1 moves focus to the first tab of row 2. */
export const Wrapping: Story = {
  render: () => (
    <div className="w-[480px]">
      <WrappingTabs />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const tabs = canvas.getAllByRole("tab");
    const list = canvas.getByRole("tablist");
    await expect(rowTops(tabs).length).toBeGreaterThanOrEqual(2);
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);

    const firstRowTop = tabs[0].offsetTop;
    const lastOnRow1 = tabs.filter((t) => t.offsetTop === firstRowTop).slice(-1)[0];
    const firstOnRow2 = tabs.find((t) => t.offsetTop > firstRowTop)!;
    lastOnRow1.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(firstOnRow2).toHaveFocus();
  },
};

/** The same eight tabs in a 320px container, with one disabled tab. Three
 *  or more rows; rows keep their natural widths and an even gap. */
export const WrappingNarrow: Story = {
  render: () => (
    <div className="w-[320px]">
      <WrappingTabs disabledValue="blocked" />
    </div>
  ),
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole("tab");
    const list = canvas.getByRole("tablist");
    await expect(rowTops(tabs).length).toBeGreaterThanOrEqual(3);
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    await expect(canvas.getByRole("tab", { name: /blocked/i })).toBeDisabled();
  },
};

/** One German label wider than the whole container. The label truncates with an
 *  ellipsis, the count badge stays visible and the list doesn't overflow. */
export const WrappingLongGermanLabel: Story = {
  render: () => (
    <div className="w-[320px]">
      <Tabs defaultValue="endorsed">
        <TabsList>
          <TabsTrigger value="all">
            <span className="truncate">Alle Anfragen</span> <Badge variant="count">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="endorsed">
            <span className="truncate">
              Befürwortet — wartet auf zweite Freigabe durch die Rechtsabteilung
            </span>{" "}
            <Badge variant="count">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <span className="truncate">Abgelehnt</span> <Badge variant="count">1</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">Alle Anfragen</TabsContent>
        <TabsContent value="endorsed">Befürwortete Anfragen</TabsContent>
        <TabsContent value="rejected">Abgelehnte Anfragen</TabsContent>
      </Tabs>
    </div>
  ),
  play: async ({ canvas }) => {
    const list = canvas.getByRole("tablist");
    const long = canvas.getByRole("tab", { name: /Befürwortet/ });
    const badge = long.querySelector<HTMLElement>("[data-slot=badge]")!;
    const label = long.querySelector<HTMLElement>(".truncate")!;
    await expect(badge).toBeVisible();
    // The badge sits inside the trigger and the trigger inside the list.
    await expect(badge.getBoundingClientRect().right).toBeLessThanOrEqual(long.getBoundingClientRect().right);
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right);
    // The label really is cut, and the list doesn't scroll.
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
  },
};

/** `variant="line"` wraps too. The active underline sits 5px below its trigger;
 *  the row gap is larger than in the default variant so it never touches the row below. */
export const WrappingLineVariant: Story = {
  render: () => (
    <div className="w-[320px]">
      <WrappingTabs variant="line" />
    </div>
  ),
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole("tab");
    const active = canvas.getByRole("tab", { selected: true });
    await expect(rowTops(tabs).length).toBeGreaterThanOrEqual(2);
    // The underline is an ::after on the active trigger: visible, and clear of the next row.
    await expect(getComputedStyle(active, "::after").opacity).toBe("1");
    const underlineBottom = active.getBoundingClientRect().bottom + 5;
    const nextRowTop = Math.min(
      ...tabs.filter((t) => t.offsetTop > active.offsetTop).map((t) => t.getBoundingClientRect().top)
    );
    await expect(underlineBottom).toBeLessThan(nextRowTop);
  },
};

/** The Suppliers Overview pattern: tabs on the left, a control on the right.
 *  The row is `flex-wrap justify-between` and the `TabsList` is `min-w-0`, so a
 *  tight container drops the search field below the tabs instead of squeezing them. */
export const WrappingInToolbar: Story = {
  render: () => (
    <div className="w-[480px]">
      <Tabs defaultValue="all" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="min-w-0">
            {WRAP_TABS.slice(0, 6).map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} <Badge variant="count">{t.count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          <Input className="w-56" placeholder="Search..." aria-label="Search" />
        </div>
        <TabsContent value="all">All items</TabsContent>
      </Tabs>
    </div>
  ),
  play: async ({ canvas }) => {
    const list = canvas.getByRole("tablist");
    const search = canvas.getByRole("textbox", { name: /search/i });
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    // The search field never overlaps the tab row: it is beside it or below it.
    const l = list.getBoundingClientRect();
    const s = search.getBoundingClientRect();
    await expect(s.left >= l.right || s.top >= l.bottom).toBe(true);
  },
};
