import type { Meta, StoryObj } from "@storybook/react-vite";

const TOKENS = [
  { group: "Base", items: ["background", "foreground", "card", "primary", "secondary", "muted", "accent", "border"] },
  { group: "Status", items: ["success", "warning", "destructive"] },
  { group: "Criticality", items: ["critical", "high", "medium", "low"] },
  { group: "Badge tints (soft / ink)", items: ["critical-soft", "critical-ink", "success-soft", "success-ink", "warning-soft", "warning-ink"] },
  { group: "Charts", items: ["chart-orange", "purple"] },
];

function Swatch({ token }: { token: string }) {
  return (
    <div style={{ width: 120 }}>
      <div
        style={{
          height: 48,
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: `var(--color-${token}, var(--${token}))`,
        }}
      />
      <div style={{ fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{token}</div>
    </div>
  );
}

function Palette() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {TOKENS.map((g) => (
        <div key={g.group}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{g.group}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {g.items.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Foundation/Colors",
  component: Palette,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Palette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
