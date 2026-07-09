/*
 * Lynk UI Library — Semantic class maps
 * -------------------------------------
 * Maps a *meaning* (criticality, status tone, diff state, chart series)
 * to the Tailwind classes that render it. Every class here resolves to a
 * token in tokens.css, so this is the one place to change how a meaning
 * looks — the change flows to every screen that uses it.
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

export type Tone =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple"
  | "dark";

/** Soft-tinted background + accessible ink text per tone (WCAG 2.2 AA), used by Badge. */
export const toneClass: Record<Tone, string> = {
  critical: "bg-critical-soft text-critical-ink",
  high: "bg-high-soft text-high-ink",
  medium: "bg-medium-soft text-medium-ink",
  low: "bg-low-soft text-low-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-critical-soft text-critical-ink",
  info: "bg-medium-soft text-medium-ink",
  neutral: "bg-secondary text-secondary-foreground",
  purple: "bg-purple-soft text-purple-ink",
  dark: "bg-primary text-primary-foreground",
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
