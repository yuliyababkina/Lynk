import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-2xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Lynk semantic tones — WCAG-AA soft tint + ink text (see tokens.css)
        critical: "bg-critical-soft text-critical-ink",
        high: "bg-high-soft text-high-ink",
        medium: "bg-medium-soft text-medium-ink",
        low: "bg-low-soft text-low-ink",
        success: "bg-success-soft text-success-ink",
        warning: "bg-warning-soft text-warning-ink",
        // Compliance lifecycle: 30-day stage — distinct orange, one step past amber
        orange: "bg-chart-orange-soft text-chart-orange-ink",
        info: "bg-medium-soft text-medium-ink",
        danger: "bg-critical-soft text-critical-ink",
        purple: "bg-purple-soft text-purple-ink",
        neutral: "bg-secondary text-secondary-foreground",
        dark: "bg-primary text-primary-foreground",
        // Outline status pills — faint tint + colored border/text (Figma document
        // + sensitive/action-required pills). Pairs with the soft variants above.
        "success-outline": "border-success/30 bg-success-soft/50 text-success-ink",
        "warning-outline": "border-warning/30 bg-warning-soft/50 text-warning-ink",
        "orange-outline": "border-chart-orange/30 bg-chart-orange-soft/50 text-chart-orange-ink",
        "critical-outline": "border-critical/30 bg-critical-soft text-critical-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
