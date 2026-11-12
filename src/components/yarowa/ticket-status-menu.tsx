/**
 * @custom   Status pill that opens a menu to move a ticket between the three
 *           workflow statuses, tinted per status and safe inside a clickable row.
 *           DropdownMenu has no status-tinted pill trigger. Composes DropdownMenu
 *           and TicketStatusIcon.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { Check, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TicketStatusIcon } from "@/components/yarowa/ticket-status-icon";
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

  return (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        {/* Styled like a Button but not asChild: Button is not a forwardRef component
            on React 18, so the menu could not measure it to position itself. */}
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-auto gap-1 rounded-full border-0 py-0.5 pl-1 pr-2 text-xs",
            PILL[status]
          )}
        >
          <TicketStatusIcon status={status} />
          {t(status)}
          <ChevronDown size={12} className="size-3 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-[150px]">
          {STATUS_ORDER.map((s) => (
            <DropdownMenuItem
              key={s}
              aria-current={s === status ? "true" : undefined}
              onSelect={() => {
                if (s !== status) onChange(s);
              }}
            >
              <TicketStatusIcon status={s} size={16} />
              <span className="flex-1">{t(s)}</span>
              {s === status && <Check size={14} className="size-3.5 text-muted-foreground" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
