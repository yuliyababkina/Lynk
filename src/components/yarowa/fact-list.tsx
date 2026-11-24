/**
 * @custom   Label/value list of a record's facts ("Document expires — Expires in
 *           55 days · 12 Aug 2026") for the 380px detail rails. Shared by the
 *           ticket panel and the Compliance drawer so a record reads the same in
 *           both. shadcn has no description-list component; a Table would
 *           bring header semantics a fact list doesn't have.
 * @approved Yuliya Babkina, 2026-11-25
 */
import { cn } from "@/lib/utils";
import { Text } from "@/shared/ui/typography";

export interface Fact {
  /** Already translated. */
  label: string;
  value: string;
  /** "danger" for a date that has passed or a state that blocks work. */
  tone?: "danger";
}

export function FactList({ facts, className }: { facts: Fact[]; className?: string }) {
  if (facts.length === 0) return null;
  return (
    <dl className={cn("grid grid-cols-[132px_1fr] gap-x-3 gap-y-1.5", className)}>
      {facts.map((f) => (
        <div key={f.label} className="contents">
          <dt className="pt-px text-xs text-muted-foreground">{f.label}</dt>
          <dd className="min-w-0">
            <Text as="span" variant="label" className={cn(f.tone === "danger" && "text-critical-ink")}>
              {f.value}
            </Text>
          </dd>
        </div>
      ))}
    </dl>
  );
}
