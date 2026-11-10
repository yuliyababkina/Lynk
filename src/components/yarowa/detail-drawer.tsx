import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * Right-hand detail panel shell — the sliding 380px rail used when a row is
 * opened. Shared by the PM Task Queue (TicketDrawer) and the Supplier Portal
 * activity drawer so both open the same way. `header` fills the top bar next to
 * the close button; `children` is the scrollable body.
 */
export function DetailDrawer({
  header,
  children,
  onClose,
}: {
  header?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-card h-full overflow-y-auto animate-in slide-in-from-right-6 fade-in duration-200">
      <div className="p-4 flex items-start justify-between border-b border-border">
        <div className="min-w-0 flex-1">{header}</div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="ml-2 h-auto shrink-0 border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
        >
          <X size={18} className="size-[18px]" />
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
