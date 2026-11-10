import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/*
 * Segmented filter/tab control. Custom to Lynk (no shadcn equivalent used here).
 */
export function Pill({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto gap-0 rounded-md border-0 px-3 py-1.5 text-sm font-medium",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-muted-foreground dark:hover:bg-secondary"
      )}
    >
      {children}
      {count !== undefined && <span className="ml-1 opacity-70">{count}</span>}
    </Button>
  );
}
