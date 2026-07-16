import { useMemo, useState } from "react";
import {
  Check,
  ShieldCheck, Shield, FileText, ClipboardList, Rocket,
  ChevronDown, CircleCheck,
  type LucideIcon,
} from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Button } from "@/components/ui/button";
import { TaskGroupCard, TaskRow } from "@/components/yarowa/task-group-card";
import { TicketStatusMenu } from "@/components/yarowa/ticket-status-menu";
import { CriticalityIcon } from "@/components/yarowa/criticality-icon";
import { ACTION_ICON } from "@/lib/action-icons";
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
  onOpenSupplier,
  resolvedIds,
  onResolve,
}: {
  onSelectTicket: (t: Ticket) => void;
  onOpenSupplier: (entityName: string) => void;
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
            <TaskGroupCard
              key={group.criticality}
              icon={<CriticalityIcon criticality={group.criticality} size={17} />}
              label={criticalityLabel[group.criticality]}
              count={group.tickets.length}
            >
              {visible.map((t) => {
                const ActionIcon = ACTION_ICON[t.primaryAction];
                const CategoryIcon = CATEGORY_ICON[t.category];
                // A ticket with an uploaded renewal is reviewed (opens the doc), not dismissed.
                const reviewable =
                  t.source === "compliance-monitoring" && !!DOCS.find((d) => d.id === t.targetId)?.renewal;
                return (
                  <TaskRow
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    icon={CategoryIcon && <CategoryIcon size={16} className="text-muted-foreground" aria-hidden="true" />}
                    title={t.title}
                    subline={
                      <>
                        {t.entityType} ·{" "}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSupplier(t.entityName);
                          }}
                          className="hover:text-accent hover:underline transition-colors"
                        >
                          {t.entityName}
                        </button>{" "}
                        · {t.ageLabel}
                      </>
                    }
                    status={
                      <TicketStatusMenu status={statusOf(t)} onChange={(s) => changeStatus(t, s)} align="start" />
                    }
                    action={
                      <Button
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
                    }
                  />
                );
              })}
              {hasOverflow && (
                <button
                  onClick={() => toggleExpanded(group.criticality)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                  {isExpanded ? "Show less" : `Show ${group.tickets.length - COLLAPSED_ROWS} more`}
                </button>
              )}
            </TaskGroupCard>
          );
        })}
      </div>

      {resolvedFiltered.length > 0 && (
        <TaskGroupCard
          className="mt-4"
          icon={<CircleCheck size={17} strokeWidth={2.25} className="text-success" />}
          label="Resolved"
          count={resolvedFiltered.length}
        >
          {resolvedVisible.map((t) => {
            const CategoryIcon = CATEGORY_ICON[t.category];
            return (
              <TaskRow
                key={t.id}
                onClick={() => onSelectTicket(t)}
                muted
                icon={CategoryIcon && <CategoryIcon size={16} className="text-muted-foreground" aria-hidden="true" />}
                title={t.title}
                subline={
                  <span className="flex items-center gap-1">
                    {/* criticality demoted to a secondary tag once resolved */}
                    <CriticalityIcon criticality={t.criticality} size={14} />
                    {criticalityLabel[t.criticality]}
                    <span>·</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSupplier(t.entityName);
                      }}
                      className="hover:text-accent hover:underline transition-colors"
                    >
                      {t.entityName}
                    </button>
                  </span>
                }
                status={<TicketStatusMenu status={statusOf(t)} onChange={(s) => changeStatus(t, s)} align="end" />}
              />
            );
          })}
          {resolvedFiltered.length > COLLAPSED_ROWS && (
            <button
              onClick={() => setResolvedExpanded((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${resolvedExpanded ? "rotate-180" : ""}`}
              />
              {resolvedExpanded ? "Show less" : `Show ${resolvedFiltered.length - COLLAPSED_ROWS} more`}
            </button>
          )}
        </TaskGroupCard>
      )}
    </div>
  );
}
