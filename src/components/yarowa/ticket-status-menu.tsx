import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { TicketStatus } from "@/types";

const STATUS_ORDER: TicketStatus[] = ["To do", "In progress", "Resolved"];

// Pill tint per status — neutral (To do), blue (In progress), green (Resolved).
const PILL: Record<TicketStatus, string> = {
  "To do": "bg-secondary text-secondary-foreground",
  "In progress": "bg-medium-soft text-medium-ink",
  Resolved: "bg-success-soft text-success-ink",
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
    <g fill="none" stroke="#000" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 12h8" />
      <path d="M12 8.5 15.5 12 12 15.5" />
    </g>
  ),
  // lightning bolt (filled silhouette) — slim but sized to match the other glyphs
  "In progress": <path d="M13.6 4 8 13h3l-0.6 7 5.6-9h-3l0.6-7z" fill="#000" />,
  // checkmark (stroke)
  Resolved: (
    <path
      d="M6 12.5 10 16.5 18 7.5"
      fill="none"
      stroke="#000"
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
      className={`shrink-0 ${ICON_COLOR[status]}`}
      aria-hidden="true"
    >
      <mask id={maskId}>
        <rect width="24" height="24" fill="#fff" />
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
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-full pl-1 pr-2 py-0.5 text-xs font-medium transition-colors ${PILL[status]}`}
      >
        <StatusIcon status={status} />
        {status}
        <ChevronDown size={12} className="opacity-70" />
      </button>

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
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={s === status}
                onClick={() => {
                  if (s !== status) onChange(s);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary/60"
              >
                <StatusIcon status={s} size={16} />
                <span className="flex-1">{s}</span>
                {s === status && <Check size={14} className="text-muted-foreground" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
