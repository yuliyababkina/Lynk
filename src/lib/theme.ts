/*
 * Semantic class maps — maps a *meaning* (criticality, diff state, chart series)
 * to Tailwind classes that resolve to tokens in ui/tokens.css. One place to
 * change how a meaning looks across every screen.
 *
 * Badge tones now live as variants in components/ui/badge.tsx.
 */

import type { Criticality } from "../types";

/** Solid dot / bar colour per ticket criticality. */
export const criticalityDot: Record<Criticality, string> = {
  critical: "bg-critical",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

/** Human-readable label per criticality. */
export const criticalityLabel: Record<Criticality, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type DiffState = "added" | "changed" | "removed" | "unchanged";

/** Row background per diff state (catalogue update preview). */
export const diffRow: Record<DiffState, string> = {
  added: "bg-success/10",
  changed: "bg-warning/10",
  removed: "bg-destructive/10 text-muted-foreground line-through",
  unchanged: "",
};

/** Label text colour per diff state (accessible ink shades). */
export const diffLabel: Record<Exclude<DiffState, "unchanged">, string> = {
  added: "text-success-ink",
  changed: "text-warning-ink",
  removed: "text-critical-ink",
};

/** Categorical chart series colours. */
export const chart = {
  green: "bg-success",
  greenLight: "bg-success/70",
  amber: "bg-high",
  orange: "bg-chart-orange",
  red: "bg-critical",
  blue: "bg-medium",
  purple: "bg-purple",
};
