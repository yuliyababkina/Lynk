/**
 * @custom   Product banner with five semantic tones (error, warning, info,
 *           success, neutral) from the shared TONE scale, shared by six screens.
 *           shadcn Alert has two variants and no tones. Composes Alert.
 * @approved Yuliya Babkina, 2026-11-12
 */

import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert, Info, CircleCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE, type Tone } from "@/lib/tones";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type AlertBannerType = "error" | "warning" | "info" | "success" | "neutral";

/*
 * Semantic alert banner — soft tint surface, a rounded icon chip, bold title and
 * a supporting line. Colours come from the shared TONE scale (lib/tones.ts) so
 * alerts and ActionCards read as one system. All tints are the -soft/-ink pairs
 * verified against WCAG 2.2 AA.
 *
 * It is shadcn's `Alert` (icon, title and description grid, role="alert") with
 * five semantic tones on top; Alert itself has only two variants.
 */
const TYPE_META: Record<AlertBannerType, { tone: Tone; Icon: LucideIcon }> = {
  error: { tone: "danger", Icon: CircleAlert },
  warning: { tone: "warning", Icon: TriangleAlert },
  info: { tone: "info", Icon: Info },
  success: { tone: "success", Icon: CircleCheck },
  neutral: { tone: "neutral", Icon: Info },
};

// Alert colours its icon with currentColor; these set the tone's ink on the icon
// instead. Written out so Tailwind sees each class (TONE's ink has no svg prefix).
const ICON_INK: Record<Tone, string> = {
  warning: "*:[svg]:text-warning-ink",
  info: "*:[svg]:text-medium-ink",
  danger: "*:[svg]:text-critical-ink",
  success: "*:[svg]:text-success-ink",
  neutral: "*:[svg]:text-foreground",
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
    <Alert className={cn("py-4 text-foreground", t.surface, t.border, ICON_INK[tone], className)}>
      {icon && <Icon size={16} aria-hidden="true" />}
      {title && <AlertTitle className="font-semibold">{title}</AlertTitle>}
      {children && <AlertDescription className="text-xs">{children}</AlertDescription>}
    </Alert>
  );
}
