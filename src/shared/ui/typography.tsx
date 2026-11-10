// src/shared/ui/typography.tsx
//
// The type scale, as components. Adapted from the Foundry scaffold; the sizes
// below are Lynk's own, taken from how src/pages was already styled.
//
// shadcn ships no Typography component, so this is ours. It lives in shared/ui
// rather than components/ui because components/ui is CLI-managed: anything put
// there is one `shadcn add` away from being overwritten, and it would inherit
// the relaxed generated-code lint tier.
//
// Without it, every screen writes its own heading (`text-2xl font-bold`,
// `text-xl font-semibold`, `text-3xl font-bold`…) — type drifting outside the
// design system, the same failure as `bg-blue-500`, which lint already bans.
//
// Raw <h1>, <p>, <ul> stay legal for prose blocks. Use these for UI chrome:
// screen titles, section headings, labels, helper text.
//
// Scale, as measured in src/pages:
//   Heading 1  text-2xl bold      page title            (21 of 26 page <h1>s)
//   Heading 2  text-lg semibold   section heading
//   Heading 3  text-base semibold card / sub-section title
//   Heading 4  text-sm semibold   small group title
//   Text body / muted / small / label / eyebrow / stat / mono

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("text-foreground scroll-m-20", {
  variants: {
    level: {
      1: "text-2xl font-bold",
      2: "text-lg font-semibold",
      3: "text-base font-semibold",
      4: "text-sm font-semibold",
    },
  },
  defaultVariants: { level: 2 },
});

type HeadingLevel = 1 | 2 | 3 | 4;

export function Heading({
  level = 2,
  className,
  as,
  ...props
}: ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & {
    level?: HeadingLevel;
    /**
     * Render a different tag than the level implies.
     *
     * Visual weight and document outline are separate concerns: a card title
     * that should look like a level 3 might still need to be an <h2> for
     * screen readers, or a <div> inside a landmark that already has a heading.
     */
    as?: "h1" | "h2" | "h3" | "h4" | "div";
  }) {
  const Tag = as ?? (`h${level}` as const);
  return (
    <Tag
      data-slot="heading"
      className={cn(headingVariants({ level }), className)}
      {...props}
    />
  );
}

const textVariants = cva("", {
  variants: {
    variant: {
      /** Default reading size, 14px. */
      body: "text-sm text-foreground",
      /** Secondary body copy. */
      muted: "text-sm text-muted-foreground",
      /** Metadata, captions, helper text — the most common text in the app. */
      small: "text-xs text-muted-foreground",
      /** Field and row labels. */
      label: "text-sm font-medium text-foreground",
      /** Uppercase group label above a block of fields or a list. */
      eyebrow: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      /** KPI / big-number value. Use with as="div". */
      stat: "text-xl font-bold text-foreground",
      mono: "font-mono text-xs text-muted-foreground",
    },
  },
  defaultVariants: { variant: "body" },
});

export function Text({
  variant,
  className,
  as = "p",
  ...props
}: ComponentProps<"p"> &
  VariantProps<typeof textVariants> & { as?: "p" | "span" | "div" }) {
  const Tag = as;
  return (
    <Tag data-slot="text" className={cn(textVariants({ variant }), className)} {...props} />
  );
}

// The cva builders are deliberately NOT exported. Exporting non-components from
// this file trips react-refresh/only-export-components, which stays ON here
// because this file is hand-written. Keeping them private is the honest fix.
