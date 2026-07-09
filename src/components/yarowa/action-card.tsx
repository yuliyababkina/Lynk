import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE, type Tone } from "@/lib/tones";

/*
 * A full-width, tappable action choice — soft tinted surface, rounded icon chip,
 * bold title and a muted supporting line. Shares the TONE scale with AlertBanner
 * so an "info" action and an "info" alert are the same colour family.
 */
export function ActionCard({
  tone = "info",
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: {
  tone?: Tone;
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-secondary/50 active:translate-y-px",
        className
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", t.chip)}>
        <Icon size={18} className={t.ink} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-sm text-foreground">{title}</span>
        {description && <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>}
      </span>
    </button>
  );
}
