/*
 * Shared semantic tone surfaces — one amber/blue/red/green/slate scale reused by
 * every soft callout in the product: AlertBanner and ActionCard both read from
 * here so an "info" alert and an "info" action card are visibly the same family.
 *
 * Each tone resolves to the single colourscale defined in styles/tokens.css:
 *   surface = the pale tint background (-soft)
 *   chip    = the slightly deeper square that holds the icon
 *   ink     = accessible icon/text colour on the tint (-ink)
 *   border  = hairline in the same hue
 */
export type Tone = "warning" | "info" | "danger" | "success" | "neutral";

export const TONE: Record<Tone, { surface: string; chip: string; ink: string; border: string }> = {
  warning: { surface: "bg-warning-soft", chip: "bg-warning/15", ink: "text-warning-ink", border: "border-warning/25" },
  info: { surface: "bg-medium-soft", chip: "bg-medium/15", ink: "text-medium-ink", border: "border-medium/25" },
  danger: { surface: "bg-critical-soft", chip: "bg-critical/15", ink: "text-critical-ink", border: "border-critical/25" },
  success: { surface: "bg-success-soft", chip: "bg-success/15", ink: "text-success-ink", border: "border-success/25" },
  neutral: { surface: "bg-secondary", chip: "bg-foreground/10", ink: "text-foreground", border: "border-border" },
};
