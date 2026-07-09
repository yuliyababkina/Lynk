import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SupplierReviewTable, type ReviewSupplier } from "./supplier-review-table";

const SUPPLIERS: ReviewSupplier[] = [
  { id: "riedel", name: "Riedel Fertigungen GmbH", region: "Bavaria" },
  { id: "bauparts", name: "BauParts GmbH", region: "Bavaria" },
  { id: "mueller", name: "Müller Logistik KG", region: "Bavaria" },
  { id: "werner", name: "Werner & Co KG", region: "Bavaria" },
  { id: "bauer", name: "Bauer Sanitär GmbH", region: "Bavaria" },
  { id: "novak", name: "Novak Installationstechnik", region: "Bavaria" },
];

/** Stateful wrapper so the checkboxes and select-all controls work in the story. */
function Harness({ suppliers, initial }: { suppliers: ReviewSupplier[]; initial: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  return (
    <SupplierReviewTable
      suppliers={suppliers}
      selected={selected}
      onToggle={(id) =>
        setSelected((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        })
      }
      onSelectAll={() => setSelected(new Set(suppliers.map((s) => s.id)))}
      onDeselectAll={() => setSelected(new Set())}
    />
  );
}

const meta = {
  title: "Product Components/Supplier Review Table",
  component: SupplierReviewTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  // Default args satisfy the required props; interactive stories override via render.
  args: {
    suppliers: [],
    selected: new Set<string>(),
    onToggle: () => {},
    onSelectAll: () => {},
    onDeselectAll: () => {},
  },
} satisfies Meta<typeof SupplierReviewTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All auto-matched suppliers selected (default share). */
export const Default: Story = {
  render: () => <Harness suppliers={SUPPLIERS} initial={SUPPLIERS.map((s) => s.id)} />,
  // Proves "Deselect all" clears every checkbox (interaction + state).
  play: async ({ canvas, userEvent }) => {
    const boxes = canvas.getAllByRole("checkbox");
    await expect(boxes[0]).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: /deselect all/i }));
    for (const b of boxes) await expect(b).not.toBeChecked();
  },
};

/** None selected — after "Deselect all" (edge case: nothing will be shared). */
export const NoneSelected: Story = {
  render: () => <Harness suppliers={SUPPLIERS} initial={[]} />,
};

/** Empty state — no suppliers match this region + trade. */
export const Empty: Story = {
  render: () => <Harness suppliers={[]} initial={[]} />,
};
