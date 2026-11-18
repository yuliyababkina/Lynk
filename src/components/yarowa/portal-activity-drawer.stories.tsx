import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { LynkDataProvider } from "@/lib/LynkDataContext";
import { getPortalProfile, type ActivityItem, type OverviewGroup } from "@/pages/portal/portal-data";
import { PortalActivityDrawer } from "./portal-activity-drawer";

/* Fixtures are the supplier portal's own mock profile (Martin Weber), so each
   story opens the drawer on an item the portal really shows. */
const SUPPLIER_ID = "supplier_martin_weber";
const PROFILE = getPortalProfile(SUPPLIER_ID);

function pick(groupKey: string, itemId: string): { group: OverviewGroup; item: ActivityItem } {
  const group = PROFILE.overviewGroups.find((g) => g.key === groupKey) ?? PROFILE.overviewGroups[0];
  const item = group.items.find((i) => i.id === itemId) ?? group.items[0];
  return { group, item };
}

function selectionFor(groupKey: string, itemId: string) {
  const { group, item } = pick(groupKey, itemId);
  return { item, sectionLabel: group.label, tone: group.tone };
}

const meta = {
  title: "Custom/Portal Activity Drawer",
  component: PortalActivityDrawer,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <LynkDataProvider>
        <div className="flex h-[720px] justify-end bg-sidebar">
          <Story />
        </div>
      </LynkDataProvider>
    ),
  ],
  args: {
    selection: selectionFor("action-required", "ar-1"),
    supplierId: SUPPLIER_ID,
    supplierName: "Weber Bau GmbH",
    company: PROFILE.company,
    onClose: fn(),
    onCompanyChange: fn(),
    onItemDone: fn(),
  },
} satisfies Meta<typeof PortalActivityDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A document ticket: current file, then a dropzone for the replacement. */
export const DocumentItem: Story = {
  play: async ({ canvas, args }) => {
    await expect(
      await canvas.findByRole("heading", { level: 3, name: args.selection.item?.title })
    ).toBeVisible();
  },
};

/** A document plus profile fields to correct. */
export const MixedItem: Story = { args: { selection: selectionFor("action-required", "ar-2") } };

/** Profile fields only. */
export const DataItem: Story = { args: { selection: selectionFor("expiring-soon", "es-2") } };

/** Already submitted: read-only, waiting on the principal. */
export const PendingApproval: Story = { args: { selection: selectionFor("pending-approval", "pa-1") } };

/** Opened from the quick-action card, with nothing preselected. */
export const QuickUpload: Story = {
  args: { selection: { sectionLabel: "Action Required", tone: "critical", quick: "upload" } },
};

export const QuickDataChange: Story = {
  args: { selection: { sectionLabel: "Action Required", tone: "critical", quick: "data" } },
};
