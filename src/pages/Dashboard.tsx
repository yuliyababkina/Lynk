import { useMemo, useState } from "react";
import {
  Eye, AlertTriangle, RefreshCw, Bell, Check, Send,
  ShieldCheck, Shield, FileText, ClipboardList, Rocket,
  ChevronDown, CircleCheck,
  type LucideIcon,
} from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Button } from "@/components/ui/button";
import { TicketStatusMenu } from "@/components/yarowa/ticket-status-menu";
import { CriticalityIcon } from "@/components/yarowa/criticality-icon";
import { criticalityLabel } from "@/lib/theme";
import type { Ticket, Criticality, TicketCategory, TicketStatus } from "../types";

const CATEGORIES: TicketCategory[] = [
  "Document compliance",
  "Data governance",
  "Contracts",
  "Service agreements",
  "Onboarding",
];

const CRITICALITY_ORDER: Criticality[] = ["critical", "high", "medium", "low"];
// Rows shown per group before the "show more" toggle appears.
const COLLAPSED_ROWS = 5;
const ACTION_ICON: Record<string, LucideIcon> = {
  Review: Eye,
  Escalate: AlertTriangle,
  Renew: RefreshCw,
  Remind: Bell,
  Approve: Check,
  Request: Send,
};
// Icon illustrating each ticket type (mirrors the sidebar module iconography).
const CATEGORY_ICON: Record<TicketCategory, LucideIcon> = {
  "Document compliance": ShieldCheck,
  "Data governance": Shield,
  Contracts: FileText,
  "Service agreements": ClipboardList,
  Onboarding: Rocket,
};

export function Dashboard({
  onSelectTicket,
  resolvedIds,
  onResolve,
}: {
  onSelectTicket: (t: Ticket) => void;
  resolvedIds: Set<string>;
  onResolve: (t: Ticket, action: string) => void;
}) {
  const { tickets: TICKETS, docs: DOCS, ticketStatusById, setTicketStatus } = useLynkData();
  const [filter, setFilter] = useState<"All tickets" | TicketCategory>("All tickets");
  const [expanded, setExpanded] = useState<Set<Criticality>>(new Set());
  const [resolvedExpanded, setResolvedExpanded] = useState(false);

  const statusOf = (t: Ticket): TicketStatus =>
    ticketStatusById.get(t.id) ?? (resolvedIds.has(t.id) ? "Resolved" : "To do");

  const toggleExpanded = (c: Criticality) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  const byCategory = (list: Ticket[]) =>
    filter === "All tickets" ? list : list.filter((t) => t.category === filter);

  const open = useMemo(() => TICKETS.filter((t) => !resolvedIds.has(t.id)), [TICKETS, resolvedIds]);
  const resolved = useMemo(() => TICKETS.filter((t) => resolvedIds.has(t.id)), [TICKETS, resolvedIds]);

  const filtered = byCategory(open);
  const resolvedFiltered = byCategory(resolved);

  const grouped = CRITICALITY_ORDER.map((c) => ({
    criticality: c,
    tickets: filtered.filter((t) => t.criticality === c),
  })).filter((g) => g.tickets.length > 0);

  const counts: Record<"All tickets" | TicketCategory, number> = {
    "All tickets": open.length,
    ...Object.fromEntries(
      CATEGORIES.map((c) => [c, open.filter((t) => t.category === c).length])
    ),
  } as Record<"All tickets" | TicketCategory, number>;

  // Move a ticket via the status pill. Resolving routes through onResolve so the
  // user still gets the toast + undo; other transitions persist directly.
  const changeStatus = (t: Ticket, next: TicketStatus) => {
    if (next === "Resolved") onResolve(t, t.primaryAction);
    else setTicketStatus(t, next);
  };

  const resolvedVisible = resolvedExpanded ? resolvedFiltered : resolvedFiltered.slice(0, COLLAPSED_ROWS);

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

      {grouped.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl py-16 text-center">
          <Check className="mx-auto mb-3 text-success-ink" size={28} />
          <p className="text-sm font-medium">You're all caught up</p>
          <p className="text-xs text-muted-foreground mt-1">
            No open tickets{filter !== "All tickets" ? ` in ${filter}` : ""}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {grouped.map((group) => {
          const isExpanded = expanded.has(group.criticality);
          const hasOverflow = group.tickets.length > COLLAPSED_ROWS;
          const visible = isExpanded ? group.tickets : group.tickets.slice(0, COLLAPSED_ROWS);
          return (
            <div key={group.criticality} className="bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 bg-secondary/60 border-b border-border px-4 py-2.5 rounded-t-2xl">
                <CriticalityIcon criticality={group.criticality} size={17} />
                <span className="text-[11px] font-bold tracking-wide uppercase">
                  {criticalityLabel[group.criticality]}
                </span>
                <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-border text-xs font-bold text-foreground">
                  {group.tickets.length}
                </span>
              </div>
              <div>
                {visible.map((t, i) => {
                  const ActionIcon = ACTION_ICON[t.primaryAction];
                  const CategoryIcon = CATEGORY_ICON[t.category];
                  // A ticket with an uploaded renewal is reviewed (opens the doc), not dismissed.
                  const reviewable =
                    t.source === "compliance-monitoring" && !!DOCS.find((d) => d.id === t.targetId)?.renewal;
                  return (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectTicket(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectTicket(t);
                        }
                      }}
                      className={`ticket-row w-full text-left px-4 py-3.5 hover:bg-secondary/40 transition-colors ${
                        i < visible.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      {CategoryIcon && (
                        <CategoryIcon size={16} className="tr-icon text-muted-foreground mt-0.5" aria-hidden="true" />
                      )}
                      <div className="tr-main">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.entityType} · {t.entityName} · {t.ageLabel}
                        </div>
                      </div>
                      <div className="tr-status">
                        <TicketStatusMenu
                          status={statusOf(t)}
                          onChange={(s) => changeStatus(t, s)}
                          align="start"
                        />
                      </div>
                      <Button
                        className="tr-action"
                        variant={t.criticality === "critical" || t.criticality === "high" ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (reviewable) onSelectTicket(t);
                          else onResolve(t, t.primaryAction);
                        }}
                      >
                        {ActionIcon && <ActionIcon size={14} />}
                        {t.primaryAction}
                      </Button>
                    </div>
                  );
                })}
                {hasOverflow && (
                  <button
                    onClick={() => toggleExpanded(group.criticality)}
                    className="w-full flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                    {isExpanded ? "Show less" : `Show ${group.tickets.length - COLLAPSED_ROWS} more`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {resolvedFiltered.length > 0 && (
        <div className="bg-card border border-border rounded-2xl mt-4">
          <div className="flex items-center gap-2 bg-secondary/60 border-b border-border px-4 py-2.5 rounded-t-2xl">
            <CircleCheck size={17} strokeWidth={2.25} className="text-success" />
            <span className="text-[11px] font-bold tracking-wide uppercase">Resolved</span>
            <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-border text-xs font-bold text-foreground">
              {resolvedFiltered.length}
            </span>
          </div>
          <div>
            {resolvedVisible.map((t, i) => {
              const CategoryIcon = CATEGORY_ICON[t.category];
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTicket(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectTicket(t);
                    }
                  }}
                  className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors ${
                    i < resolvedVisible.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {CategoryIcon && (
                      <CategoryIcon size={16} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate text-muted-foreground">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        {/* criticality demoted to a secondary tag once resolved */}
                        <CriticalityIcon criticality={t.criticality} size={14} />
                        {criticalityLabel[t.criticality]}
                        <span>·</span>
                        {t.entityName}
                      </div>
                    </div>
                  </div>
                  <TicketStatusMenu
                    status={statusOf(t)}
                    onChange={(s) => changeStatus(t, s)}
                    align="end"
                  />
                </div>
              );
            })}
            {resolvedFiltered.length > COLLAPSED_ROWS && (
              <button
                onClick={() => setResolvedExpanded((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform ${resolvedExpanded ? "rotate-180" : ""}`}
                />
                {resolvedExpanded ? "Show less" : `Show ${resolvedFiltered.length - COLLAPSED_ROWS} more`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
