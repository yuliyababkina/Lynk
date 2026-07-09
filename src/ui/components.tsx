import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { toneClass, type Tone } from "./theme";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "danger" | "warning" | "success" | "info";
}) {
  const toneColor: Record<string, string> = {
    default: "text-foreground",
    danger: "text-critical-ink",
    warning: "text-warning-ink",
    success: "text-success-ink",
    info: "text-accent",
  };
  return (
    <Card className="p-4 flex-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className={cn("text-2xl font-bold", toneColor[tone])}>{value}</div>
    </Card>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  variant = "default",
  className,
  children,
  onClick,
  disabled,
}: {
  variant?: "default" | "outline" | "ghost" | "danger" | "success";
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border border-border bg-transparent hover:bg-secondary",
    ghost: "bg-transparent hover:bg-secondary",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
    success: "bg-success text-success-foreground hover:opacity-90",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Pill({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
      )}
    >
      {children}
      {count !== undefined && <span className="ml-1 opacity-70">{count}</span>}
    </button>
  );
}
