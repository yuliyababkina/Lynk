import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * @custom   A whole Card that opens something on click (role cards, stat tiles,
 *           list items in a master-detail view). shadcn Card is not pressable and
 *           Button can't hold block content (headings, badges) without becoming
 *           invalid HTML, so <div role="button"> crept in four times — without
 *           keyboard support. This composes the two instead: the title sits in a
 *           real Button whose ::after stretches over the card, so the whole card
 *           is clickable, Enter/Space work natively, and a screen reader hears
 *           only the title. Styling stays in ui/card.tsx and ui/button.tsx.
 * @approved Yuliya Babkina, 2026-11-18
 */
export function ClickableCard({
  active = false,
  className,
  ...props
}: ComponentProps<typeof Card> & {
  /** The selected item in a master-detail list. */
  active?: boolean;
}) {
  return (
    <Card
      data-active={active || undefined}
      className={cn(
        "relative cursor-pointer border border-border shadow-none ring-0 transition-colors hover:bg-secondary/50",
        "has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/30",
        "data-active:border-primary data-active:bg-secondary/60",
        className
      )}
      {...props}
    />
  );
}

/**
 * The card's label and its only interactive element. Wrap the title in it; put
 * no other buttons or links inside a ClickableCard, since the stretched hit
 * area covers them.
 */
export function ClickableCardTrigger({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant" | "size" | "asChild">) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "static h-auto justify-start gap-0 rounded-none border-0 p-0 text-left font-normal whitespace-normal text-inherit",
        "hover:bg-transparent hover:text-inherit dark:hover:bg-transparent",
        // A translate on the button would make it the containing block of its
        // ::after and shrink the hit area back to the title mid-click (mouseup
        // lands outside it, so no click fires). The press nudge stays off.
        "focus-visible:ring-0 active:not-aria-[haspopup]:translate-none!",
        "after:absolute after:inset-0 after:content-['']",
        className
      )}
      {...props}
    />
  );
}
