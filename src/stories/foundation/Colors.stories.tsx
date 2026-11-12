import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "@/shared/ui/typography";

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

/* One literal class per token: Tailwind only generates utilities it can read in
   source, so `bg-${token}` would render nothing. A token missing from this map,
   or without a utility, shows up here as an empty swatch. */
const SWATCH_BG: Record<string, string> = {
  "background": "bg-background",
  "foreground": "bg-foreground",
  "card": "bg-card",
  "primary": "bg-primary",
  "secondary": "bg-secondary",
  "muted": "bg-muted",
  "accent": "bg-accent",
  "border": "bg-border",
  "yarowa-green": "bg-yarowa-green",
  "primary-hover": "bg-primary-hover",
  "primary-active": "bg-primary-active",
  "secondary-brand": "bg-secondary-brand",
  "secondary-brand-hover": "bg-secondary-brand-hover",
  "secondary-brand-active": "bg-secondary-brand-active",
  "secondary-brand-foreground": "bg-secondary-brand-foreground",
  "secondary-brand-ring": "bg-secondary-brand-ring",
  "secondary-foreground": "bg-secondary-foreground",
  "muted-foreground": "bg-muted-foreground",
  "input": "bg-input",
  "ring": "bg-ring",
  "sidebar": "bg-sidebar",
  "sidebar-accent": "bg-sidebar-accent",
  "sidebar-accent-foreground": "bg-sidebar-accent-foreground",
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  "success": "bg-success",
  "warning": "bg-warning",
  "destructive": "bg-destructive",
  "critical": "bg-critical",
  "high": "bg-high",
  "medium": "bg-medium",
  "low": "bg-low",
  "critical-soft": "bg-critical-soft",
  "critical-ink": "bg-critical-ink",
  "success-soft": "bg-success-soft",
  "success-ink": "bg-success-ink",
  "warning-soft": "bg-warning-soft",
  "warning-ink": "bg-warning-ink",
  "chart-orange": "bg-chart-orange",
  "purple": "bg-purple",
};

function Swatch({ token }: { token: string }) {
  return (
    <div className="w-[120px]">
      <div className={`h-12 rounded-lg border border-border ${SWATCH_BG[token]}`} />
      <div className="mt-1 font-mono text-[11px]">{token}</div>
    </div>
  );
}

function Palette() {
  return (
    <div className="flex flex-col gap-5">
      {TOKENS.map((g) => (
        <div key={g.group}>
          <Heading level={4} as="div" className="mb-2">{g.group}</Heading>
          <div className="flex flex-wrap gap-3">
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
