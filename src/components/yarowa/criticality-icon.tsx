import { ChevronsUp, ChevronUp, Equal, ChevronDown, type LucideIcon } from "lucide-react";
import type { Criticality } from "@/types";

// Jira/Linear-style priority arrows — direction encodes rank (up = more urgent).
const ICON: Record<Criticality, LucideIcon> = {
  critical: ChevronsUp,
  high: ChevronUp,
  medium: Equal,
  low: ChevronDown,
};

// Strong criticality colour (same hue family as the badge tints / text).
const COLOR: Record<Criticality, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
};

export function CriticalityIcon({
  criticality,
  size = 16,
  className = "",
}: {
  criticality: Criticality;
  size?: number;
  className?: string;
}) {
  const Icon = ICON[criticality];
  return (
    <Icon
      size={size}
      strokeWidth={2.25}
      className={`${COLOR[criticality]} ${className}`}
      aria-hidden="true"
    />
  );
}
