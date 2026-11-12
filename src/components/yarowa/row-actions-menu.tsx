/**
 * @custom   Row-level ⋮ actions menu revealed on row hover and kept visible while
 *           open: a DropdownMenu with a ghost icon trigger and an optional
 *           destructive item. DropdownMenu has no hover-reveal trigger, and the
 *           single use is a table row. Composes DropdownMenu.
 * @approved Yuliya Babkina, 2026-11-12
 */

import type { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Renders in destructive styling — for irreversible actions. */
  destructive?: boolean;
}

/**
 * Row-level "⋮" actions menu. Revealed on row hover (the row needs `group`), and
 * kept visible while open or keyboard-focused so it can't disappear mid-use.
 * Stops click propagation so using it never also opens the row.
 */
export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const { t } = useI18n();
  if (actions.length === 0) return null;

  return (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        {/* Styled like a Button but not asChild: Button is not a forwardRef component
            on React 18, so the menu could not measure it to position itself. */}
        <DropdownMenuTrigger
          aria-label={t("Row actions")}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            // Hidden at rest, revealed on row hover — but always visible while open.
            "h-auto rounded-md border-0 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary hover:text-foreground focus-visible:opacity-100 data-[state=open]:bg-transparent data-[state=open]:opacity-100 dark:hover:bg-secondary"
          )}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          {actions.map((a) => (
            <DropdownMenuItem
              key={a.label}
              // Not variant="destructive": that variant's own text colour resolves to
              // white here, so the tint is spelled out.
              className={
                a.destructive
                  ? "text-destructive focus:bg-destructive/10 focus:text-destructive *:[svg]:text-destructive"
                  : undefined
              }
              onSelect={a.onSelect}
            >
              {a.icon}
              {t(a.label)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
