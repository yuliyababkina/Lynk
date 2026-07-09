import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert, Info, CircleCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE, type Tone } from "@/lib/tones";

export type AlertBannerType = "error" | "warning" | "info" | "success" | "neutral";

/*
 * Semantic alert banner — soft tint surface, a rounded icon chip, bold title and
 * a supporting line. Colours come from the shared TONE scale (lib/tones.ts) so
 * alerts and ActionCards read as one system. All tints are the -soft/-ink pairs
 * verified against WCAG 2.2 AA.
 *
 * This is our opinionated product banner (5 semantic types), distinct from the
 * shadcn `Alert` primitive in components/ui/alert.tsx (2 variants).
 */
const TYPE_META: Record<AlertBannerType, { tone: Tone; Icon: LucideIcon }> = {
  error: { tone: "danger", Icon: CircleAlert },
  warning: { tone: "warning", Icon: TriangleAlert },
  info: { tone: "info", Icon: Info },
  success: { tone: "success", Icon: CircleCheck },
  neutral: { tone: "neutral", Icon: Info },
};

export function AlertBanner({
  type = "info",
  title,
  children,
  icon = true,
  className,
}: {
  type?: AlertBannerType;
  title?: ReactNode;
  children?: ReactNode;
  /** Show the semantic icon (default true). */
  icon?: boolean;
  className?: string;
}) {
  const { tone, Icon } = TYPE_META[type];
  const t = TONE[tone];
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-2.5 rounded-2xl border p-4 text-foreground", t.surface, t.border, className)}
    >
      {icon && <Icon size={16} className={cn("shrink-0 mt-0.5", t.ink)} aria-hidden="true" />}
      <div className="min-w-0">
        {title && <div className="font-semibold text-sm">{title}</div>}
        {children && <div className="text-xs text-muted-foreground mt-0.5">{children}</div>}
      </div>
    </div>
  );
}
