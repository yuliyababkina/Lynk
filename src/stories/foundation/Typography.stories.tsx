import type { Meta, StoryObj } from "@storybook/react-vite";

function Type() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="text-2xl font-bold">Heading — Task Queue (text-2xl / bold)</div>
      <div className="text-lg font-semibold">Subheading (text-lg / semibold)</div>
      <div className="text-sm">Body text — the default 14px reading size (text-sm).</div>
      <div className="text-xs text-muted-foreground">
        Caption / metadata — muted foreground (text-xs).
      </div>
      <div className="font-mono text-xs">Mono — DE45 1203 0000 (font-mono / text-xs)</div>
      <p className="text-xs text-muted-foreground mt-2">Font family: Geist Variable (from the preset).</p>
    </div>
  );
}

const meta = {
  title: "Foundation/Typography",
  component: Type,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Type>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
