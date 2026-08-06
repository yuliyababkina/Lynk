import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Standard step footer used across the onboarding / portal flows:
 * a secondary "Back" on the left, and the primary action hugging the right.
 * With no `onBack`, the primary still snaps to the right. Pass the primary
 * button(s) as children (without `w-full`) so they size to their content.
 */
export function WizardFooter({
  onBack,
  backLabel = "Back",
  children,
  className,
}: {
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 pt-2", onBack ? "justify-between" : "justify-end", className)}>
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
