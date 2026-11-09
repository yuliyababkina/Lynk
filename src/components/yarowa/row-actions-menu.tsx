import { useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  if (actions.length === 0) return null;

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant="ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("Row actions")}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-auto rounded-md border-0 p-1 text-muted-foreground transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 aria-expanded:bg-transparent dark:hover:bg-secondary",
          // Hidden at rest, revealed on row hover — but always visible while open.
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-xl border border-border bg-card p-1 shadow-lg"
          >
            {actions.map((a) => (
              <Button
                key={a.label}
                variant="ghost"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  a.onSelect();
                }}
                className={cn(
                  "h-auto w-full justify-start gap-2 rounded-lg border-0 px-2.5 py-2 text-left text-sm font-normal whitespace-normal",
                  a.destructive
                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/10"
                    : "text-foreground hover:bg-secondary hover:text-foreground dark:hover:bg-secondary"
                )}
              >
                {a.icon}
                {t(a.label)}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
