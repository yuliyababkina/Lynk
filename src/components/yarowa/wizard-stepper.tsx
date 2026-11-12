/**
 * @custom   Horizontal numbered stepper for multi-step flows: completed steps show
 *           a check, the current step is filled, later ones are muted, and steps
 *           are clickable when a handler is passed. shadcn ships no stepper.
 *           Composes Button.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Text } from "@/shared/ui/typography";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";

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
  const { t } = useI18n();
  const currentIdx = steps.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(s)}
              className={cn(
                "-mx-1 h-auto gap-2 rounded-md border-0 px-1 py-0 font-normal whitespace-normal hover:bg-transparent dark:hover:bg-transparent disabled:opacity-100",
                onStepClick ? "hover:opacity-70" : "cursor-default"
              )}
            >
              <Text
                variant="label"
                as="span"
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border",
                  done
                    ? "bg-success border-success text-success-foreground"
                    : active
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border text-muted-foreground"
                )}
              >
                {done ? <Check size={14} className="size-3.5" /> : i + 1}
              </Text>
              <span className={cn("text-sm", active ? "font-semibold" : "text-muted-foreground")}>
                {t(s)}
              </span>
            </Button>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
