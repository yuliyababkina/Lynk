/**
 * @custom   Filled status circle with the glyph (arrow, bolt, check) knocked out
 *           through an SVG mask so the pill's tint shows through. lucide ships
 *           outline icons only, so there is no filled variant to restyle. Pure SVG;
 *           sits beside CriticalityIcon and is used inside Button and DropdownMenu
 *           triggers.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { useId } from "react";
import type { TicketStatus } from "@/types";
import { cn } from "@/lib/utils";

// Solid circle in the status colour; the glyph is a real hole (SVG mask) so the
// background behind it shows through — grey → arrow, blue → bolt, green → check.
const ICON_COLOR: Record<TicketStatus, string> = {
  "To do": "text-muted-foreground",
  "In progress": "text-medium",
  Resolved: "text-success",
};

const GLYPH: Record<TicketStatus, JSX.Element> = {
  // right arrow (stroke)
  "To do": (
    <g fill="none" className="stroke-mask-hole" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 12h8" />
      <path d="M12 8.5 15.5 12 12 15.5" />
    </g>
  ),
  // lightning bolt (filled silhouette) — slim but sized to match the other glyphs
  "In progress": <path d="M13.6 4 8 13h3l-0.6 7 5.6-9h-3l0.6-7z" className="fill-mask-hole" />,
  // checkmark (stroke)
  Resolved: (
    <path
      d="M6 12.5 10 16.5 18 7.5"
      fill="none"
      className="stroke-mask-hole"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export function TicketStatusIcon({
  status,
  size = 14,
  className,
}: {
  status: TicketStatus;
  size?: number;
  className?: string;
}) {
  const maskId = `status-mask-${useId().replace(/:/g, "")}-${status.replace(/\s/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("shrink-0", size === 16 ? "size-4" : "size-3.5", ICON_COLOR[status], className)}
      aria-hidden="true"
    >
      <mask id={maskId}>
        <rect width="24" height="24" className="fill-mask-reveal" />
        {GLYPH[status]}
      </mask>
      <circle cx="12" cy="12" r="11" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
