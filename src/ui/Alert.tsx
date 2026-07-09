import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert, Info, CircleCheck, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export type AlertType = "error" | "warning" | "info" | "success" | "neutral";

/*
 * Semantic alert banner. Per type: 200 tint background, 400 border, 700 icon,
 * primary (--foreground) text. All combinations verified against WCAG 2.2 AA.
 * Colours come from the --alert-* tokens in tokens.css — tweak them there.
 */
const STYLES: Record<AlertType, { wrap: string; icon: string; Icon: LucideIcon }> = {
  error: {
    wrap: "bg-[var(--alert-error-bg)] border-[color:var(--alert-error-border)]",
    icon: "text-[color:var(--alert-error-icon)]",
    Icon: CircleAlert,
  },
  warning: {
    wrap: "bg-[var(--alert-warning-bg)] border-[color:var(--alert-warning-border)]",
    icon: "text-[color:var(--alert-warning-icon)]",
    Icon: TriangleAlert,
  },
  info: {
    wrap: "bg-[var(--alert-info-bg)] border-[color:var(--alert-info-border)]",
    icon: "text-[color:var(--alert-info-icon)]",
    Icon: Info,
  },
  success: {
    wrap: "bg-[var(--alert-success-bg)] border-[color:var(--alert-success-border)]",
    icon: "text-[color:var(--alert-success-icon)]",
    Icon: CircleCheck,
  },
  neutral: {
    wrap: "bg-[var(--alert-neutral-bg)] border-[color:var(--alert-neutral-border)]",
    icon: "text-[color:var(--alert-neutral-icon)]",
    Icon: Info,
  },
};

export function Alert({
  type = "info",
  title,
  children,
  icon = true,
  className,
}: {
  type?: AlertType;
  title?: ReactNode;
  children?: ReactNode;
  /** Show the semantic icon (default true). */
  icon?: boolean;
  className?: string;
}) {
  const { wrap, icon: iconColor, Icon } = STYLES[type];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 border rounded-lg px-4 py-3 text-foreground",
        wrap,
        className
      )}
    >
      {icon && <Icon size={16} className={cn("mt-0.5 shrink-0", iconColor)} aria-hidden="true" />}
      <div className="min-w-0">
        {title && <div className="font-medium text-sm">{title}</div>}
        {children && <div className="text-xs mt-0.5">{children}</div>}
      </div>
    </div>
  );
}
