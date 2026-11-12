/**
 * @custom   Full-width pressable choice: a tone-tinted icon chip, a title and a
 *           muted line, on the TONE scale shared with AlertBanner so an "info"
 *           action and an "info" alert are the same colour family. shadcn Button
 *           has no two-line layout or tinted chip, and Card is not pressable.
 *           Composes Button.
 * @approved Yuliya Babkina, 2026-11-12
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE, type Tone } from "@/lib/tones";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/shared/ui/typography";

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
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "group h-auto w-full justify-start gap-3 rounded-2xl border-border bg-card p-3.5 text-left font-normal whitespace-normal hover:bg-secondary/50 dark:hover:bg-secondary/50 active:translate-y-px",
        className
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", t.chip)}>
        <Icon size={18} className={cn("size-[18px]", t.ink)} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <Heading level={4} as="span" className="block">{title}</Heading>
        {description && <Text variant="small" as="span" className="block mt-0.5">{description}</Text>}
      </span>
    </Button>
  );
}
