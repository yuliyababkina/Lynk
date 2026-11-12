/**
 * @custom   Grouped task list shared by the manager queue and the supplier
 *           overview: a card with a tinted header (icon, label, count) over rows on
 *           a four-zone grid (icon / main / status / action) that reflows on the
 *           list's own width via container queries. shadcn Card and Item cover a
 *           surface and a single row, but neither reflows its zones by container
 *           width. Uses the .ticket-row grid in index.css.
 * @approved Yuliya Babkina, 2026-11-12
 */

import type { ReactNode, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/shared/ui/typography";

/*
 * Shared "grouped task list" surface used by the PM Task Queue (Dashboard) and the
 * Supplier Portal Overview. A card with a tinted header (leading icon + uppercase
 * label + count pill) over a divided list of TaskRows. Rows lay out on the
 * `.ticket-row` grid defined in index.css (icon / main / status / action),
 * which reflows on the list's own width, so the two surfaces stay visually
 * identical wherever they are put.
 */
export function TaskGroupCard({
  icon,
  label,
  count,
  children,
  className,
}: {
  icon?: ReactNode;
  label: string;
  count: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl", className)}>
      <div className="flex items-center gap-2 bg-secondary/60 border-b border-border px-4 py-2.5 rounded-t-2xl">
        {icon}
        <Text variant="eyebrow" as="span" className="text-foreground">{label}</Text>
        <Badge variant="outline" className="h-[22px] min-w-[22px] bg-card px-1">
          {count}
        </Badge>
      </div>
      {/* The rows reflow on this list's own width — see `.ticket-list` in
          index.css — so a card in a narrow column lays out like a narrow card,
          however wide the window happens to be. */}
      <div className="ticket-list divide-y divide-border">{children}</div>
    </div>
  );
}

export function TaskRow({
  icon,
  title,
  subline,
  status,
  action,
  onClick,
  muted,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subline?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  muted?: boolean;
  className?: string;
}) {
  const interactive = !!onClick;
  return (
    <div
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            onClick,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick!();
              }
            },
          }
        : {})}
      className={cn(
        "ticket-row px-4 py-3.5 transition-colors",
        interactive && "hover:bg-secondary/40 cursor-pointer",
        className
      )}
    >
      {icon && <span className="tr-icon mt-0.5 shrink-0">{icon}</span>}
      <div className="tr-main">
        <Text variant="label" as="div" className={cn("truncate", muted && "text-muted-foreground")}>{title}</Text>
        {subline && <div className="text-xs text-muted-foreground mt-0.5">{subline}</div>}
      </div>
      {status && <div className="tr-status">{status}</div>}
      {action && <div className="tr-action">{action}</div>}
    </div>
  );
}
