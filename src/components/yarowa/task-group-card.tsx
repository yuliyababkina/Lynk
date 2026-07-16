import type { ReactNode, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/*
 * Shared "grouped task list" surface used by the PM Task Queue (Dashboard) and the
 * Supplier Portal Overview. A card with a tinted header (leading icon + uppercase
 * label + count pill) over a divided list of TaskRows. Rows lay out on the
 * responsive `.ticket-row` grid defined in index.css (icon / main / status /
 * action), so the two surfaces stay visually identical.
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
        <span className="text-[11px] font-bold tracking-wide uppercase">{label}</span>
        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full bg-white border border-border text-xs font-bold text-foreground">
          {count}
        </span>
      </div>
      <div className="divide-y divide-border">{children}</div>
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
        <div className={cn("text-sm font-medium truncate", muted && "text-muted-foreground")}>{title}</div>
        {subline && <div className="text-xs text-muted-foreground mt-0.5">{subline}</div>}
      </div>
      {status && <div className="tr-status">{status}</div>}
      {action && <div className="tr-action">{action}</div>}
    </div>
  );
}
