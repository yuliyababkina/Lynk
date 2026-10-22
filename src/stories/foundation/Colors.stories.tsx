import type { Meta, StoryObj } from "@storybook/react-vite";

const TOKENS = [
  { group: "Base", items: ["background", "foreground", "card", "primary", "secondary", "muted", "accent", "border"] },
  {
    group: "Brand & actions",
    items: [
      "yarowa-green",
      "primary",
      "primary-hover",
      "primary-active",
      "secondary-brand",
      "secondary-brand-hover",
      "secondary-brand-active",
      "secondary-brand-foreground",
      "secondary-brand-ring",
    ],
  },
  {
    // Every grey is written on --neutral-hue (the brand's hue, tokens.css) at very
    // low chroma. White surfaces (background, card, popover) stay pure white.
    group: "Neutrals (brand-tinted)",
    items: [
      "foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "border",
      "input",
      "ring",
      "sidebar",
      "sidebar-accent",
      "sidebar-accent-foreground",
    ],
  },
  { group: "Chart greys (brand-tinted)", items: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] },
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
