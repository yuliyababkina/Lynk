import { useMemo, useState } from "react";
import { Eye, AlertTriangle, RefreshCw, Bell, Check, Send, type LucideIcon } from "lucide-react";
import { TICKETS } from "../data";
import { Button, criticalityDot, criticalityLabel } from "../ui";
import type { Ticket, Criticality, TicketCategory } from "../types";

const CATEGORIES: TicketCategory[] = [
  "Document compliance",
  "Data governance",
  "Contracts",
  "Service agreements",
  "Onboarding",
];

const CRITICALITY_ORDER: Criticality[] = ["critical", "high", "medium", "low"];
const ACTION_ICON: Record<string, LucideIcon> = {
  Review: Eye,
  Escalate: AlertTriangle,
  Renew: RefreshCw,
  Remind: Bell,
  Approve: Check,
  Request: Send,
};

export function Dashboard({ onSelectTicket }: { onSelectTicket: (t: Ticket) => void }) {
  const [filter, setFilter] = useState<"All tickets" | TicketCategory>("All tickets");

  const filtered = useMemo(
    () => (filter === "All tickets" ? TICKETS : TICKETS.filter((t) => t.category === filter)),
    [filter]
  );

  const grouped = CRITICALITY_ORDER.map((c) => ({
    criticality: c,
    tickets: filtered.filter((t) => t.criticality === c),
  })).filter((g) => g.tickets.length > 0);

  const counts: Record<"All tickets" | TicketCategory, number> = {
    "All tickets": TICKETS.length,
    ...Object.fromEntries(
      CATEGORIES.map((c) => [c, TICKETS.filter((t) => t.category === c).length])
    ),
  } as Record<"All tickets" | TicketCategory, number>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Task Queue</h1>
      <p className="text-sm text-muted-foreground mb-4">Sorted by criticality. Click a ticket to open it.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(["All tickets", ...CATEGORIES] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-secondary/50"
            }`}
          >
            {f}
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                filter === f ? "bg-white/20 text-white" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {grouped.map((group) => (
          <div key={group.criticality} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 bg-secondary/60 border-b border-border px-4 py-2.5">
              <span className={`w-2 h-2 rounded-full ${criticalityDot[group.criticality]}`} />
              <span className="text-[11px] font-bold tracking-wide uppercase">
                {criticalityLabel[group.criticality]}
              </span>
              <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-border text-xs font-bold text-foreground">
                {group.tickets.length}
              </span>
            </div>
            <div>
              {group.tickets.map((t, i) => {
                const ActionIcon = ACTION_ICON[t.primaryAction];
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors ${
                      i < group.tickets.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.entityType} · {t.entityName} · {t.ageLabel}
                      </div>
                    </div>
                    <Button
                      variant={t.criticality === "critical" || t.criticality === "high" ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {ActionIcon && <ActionIcon size={14} />}
                      {t.primaryAction}
                    </Button>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
