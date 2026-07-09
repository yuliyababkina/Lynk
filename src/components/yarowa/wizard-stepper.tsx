import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Horizontal numbered stepper for multi-step wizards (Create / Update Catalogue).
 * Steps before the current one show a check; the current one is highlighted;
 * later ones are muted. Steps are clickable when onStepClick is provided.
 */
export function WizardStepper({
  steps,
  current,
  onStepClick,
}: {
  steps: readonly string[];
  current: string;
  onStepClick?: (step: string) => void;
}) {
  const currentIdx = steps.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(s)}
              className={cn(
                "flex items-center gap-2 rounded-md px-1 -mx-1 transition-opacity",
                onStepClick ? "hover:opacity-70" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                  done
                    ? "bg-success border-success text-white"
                    : active
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border text-muted-foreground"
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className={cn("text-sm", active ? "font-semibold" : "text-muted-foreground")}>
                {s}
              </span>
            </button>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
