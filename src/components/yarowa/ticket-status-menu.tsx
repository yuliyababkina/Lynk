import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TicketStatus } from "@/types";
import { useI18n } from "@/lib/i18n-context";

const STATUS_ORDER: TicketStatus[] = ["To do", "In progress", "Resolved"];

// Pill tint per status — neutral (To do), blue (In progress), green (Resolved).
// The pill is a ghost <Button>; its hover and expanded fills are pinned to the
// status tint so it keeps the same colour in every state.
const PILL: Record<TicketStatus, string> = {
  "To do":
    "bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground dark:hover:bg-secondary",
  "In progress":
    "bg-medium-soft text-medium-ink hover:bg-medium-soft hover:text-medium-ink aria-expanded:bg-medium-soft aria-expanded:text-medium-ink dark:hover:bg-medium-soft",
  Resolved:
    "bg-success-soft text-success-ink hover:bg-success-soft hover:text-success-ink aria-expanded:bg-success-soft aria-expanded:text-success-ink dark:hover:bg-success-soft",
};

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

function StatusIcon({ status, size = 14 }: { status: TicketStatus; size?: number }) {
  const maskId = `status-mask-${useId().replace(/:/g, "")}-${status.replace(/\s/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 ${size === 16 ? "size-4" : "size-3.5"} ${ICON_COLOR[status]}`}
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

/**
 * Compact status pill that opens a dropdown to move a ticket between the three
 * workflow statuses. Stops click propagation so it works inside a clickable row.
 */
export function TicketStatusMenu({
  status,
  onChange,
  align = "start",
}: {
  status: TicketStatus;
  onChange: (status: TicketStatus) => void;
  align?: "start" | "end";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant="ghost"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`h-auto gap-1 rounded-full border-0 py-0.5 pl-1 pr-2 text-xs ${PILL[status]}`}
      >
        <StatusIcon status={status} />
        {t(status)}
        <ChevronDown size={12} className="size-3 opacity-70" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className={`absolute z-50 mt-1 min-w-[150px] rounded-xl border border-border bg-card p-1 shadow-lg ${
              align === "end" ? "right-0" : "left-0"
            }`}
          >
            {STATUS_ORDER.map((s) => (
              <Button
                key={s}
                type="button"
                variant="ghost"
                role="option"
                aria-selected={s === status}
                onClick={() => {
                  if (s !== status) onChange(s);
                  setOpen(false);
                }}
                className="h-auto w-full justify-start gap-2 rounded-lg border-0 px-2 py-1.5 text-left text-sm font-normal hover:bg-secondary/60 dark:hover:bg-secondary/60"
              >
                <StatusIcon status={s} size={16} />
                <span className="flex-1">{t(s)}</span>
                {s === status && <Check size={14} className="size-3.5 text-muted-foreground" />}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
