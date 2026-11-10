import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InspectorContext, useInspector } from "@/shell/inspector-context";

/*
 * Shell inspector — a presentation aid, not product UI.
 *
 * When it is on, every region is outlined and labelled with who owns it: the
 * shell (header, app switcher, user, language, footer) or the micro frontend
 * (inner menu and everything in the content area). It is the quickest way to
 * show what "the shell only owns the frame" means on a real screen.
 */

export function InspectorProvider({ on, children }: { on: boolean; children: ReactNode }) {
  return <InspectorContext.Provider value={on}>{children}</InspectorContext.Provider>;
}

export function Region({
  owner,
  label,
  className,
  children,
}: {
  owner: "shell" | "mfe";
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const on = useInspector();
  return (
    <div
      data-owner={owner}
      className={cn(
        "relative",
        on &&
          (owner === "shell"
            ? "outline-2 outline-dashed -outline-offset-2 outline-brand-navy"
            : "outline-2 outline-dashed -outline-offset-2 outline-primary"),
        className
      )}
    >
      {children}
      {on ? (
        <span
          className={cn(
            "pointer-events-none absolute z-50 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase shadow-sm",
            // Shell strips are thin and busy at both ends, so their tag sits in
            // the empty middle; app regions get theirs in the bottom-right corner.
            owner === "shell"
              ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-navy text-brand-navy-foreground"
              : "right-2 bottom-1 bg-primary text-primary-foreground"
          )}
        >
          {owner === "shell" ? "Shell" : "MFE"} · {label}
        </span>
      ) : null}
    </div>
  );
}
