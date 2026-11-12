import type { Meta, StoryObj } from "@storybook/react-vite";
import { CataloguePreviewTable } from "./catalogue-preview-table";
import { PARSED_LINES, DIFF_LINES } from "@/data";

const meta = {
  title: "Product Components/Catalogue Preview Table",
  component: CataloguePreviewTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof CataloguePreviewTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Parsed initial upload — plain read-only rows, no diff. */
export const ParsedInitial: Story = {
  args: { lines: PARSED_LINES, showDiff: false },
};

/** Update flow — diff highlighting: added (green), changed (amber, old rate
 *  struck through), removed (red, struck through). */
export const DiffView: Story = {
  args: { lines: DIFF_LINES, showDiff: true },
};

/** Empty state — the uploaded file parsed to zero rows. */
export const Empty: Story = {
  args: { lines: [], showDiff: false },
};
