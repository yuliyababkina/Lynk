/**
 * @custom   New-message bell for the page header, used by every role: a Popover
 *           listing one entry per conversation with unread messages, with the
 *           latest line and its context, and a count badge on the bell. shadcn has
 *           no notification list. Composes Popover, Badge, Button and Text.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { useState } from "react";
import { Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Text } from "@/shared/ui/typography";

/**
 * New-message bell for the top header, used by every role.
 *
 * It lists one entry per conversation with unread messages, showing the latest
 * line and the context it is about, and hands the relationship back so the
 * caller can open the right chat. It does no scoping of its own — the caller
 * passes only the conversations that side is allowed to see.
 */
export interface BellEntry {
  relationship: string;
  /** Who the conversation is with, from the reader's point of view. */
  title: string;
  count: number;
  latest?: ChatMessage;
}

export function NotificationBell({
  entries,
  onOpen,
  tone = "light",
}: {
  entries: BellEntry[];
  onOpen: (relationship: string) => void;
  /** `light` is the header's own surface; `dark` remains for navy surfaces. */
  tone?: "dark" | "light";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Styled like a Button but not asChild: Button is not a forwardRef component
          on React 18, so the popover could not measure it to position itself. */}
      <PopoverTrigger
        aria-label={total > 0 ? t("{count} new messages", { count: total }) : t("No new messages")}
        title={t("Notifications")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "relative rounded-full border-0 p-0 hover:bg-transparent aria-expanded:bg-transparent dark:hover:bg-transparent",
          tone === "dark"
            ? "text-brand-navy-foreground/70 hover:text-brand-navy-foreground aria-expanded:text-brand-navy-foreground/70"
            : "text-muted-foreground hover:text-foreground aria-expanded:text-muted-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <Badge
            aria-hidden="true"
            className="absolute -right-1 -top-1 h-4 min-w-4 bg-critical px-1 text-critical-foreground"
          >
            {total > 9 ? "9+" : total}
          </Badge>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 overflow-hidden rounded-lg p-0">
        <div className="border-b border-border px-3 py-2">
          <Text variant="label" as="div" className="text-muted-foreground">
            {t("Messages")}
          </Text>
        </div>
        {entries.length === 0 ? (
          <Text variant="muted" className="px-3 py-6 text-center">
            {t("No new messages")}
          </Text>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.relationship}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    onOpen(entry.relationship);
                  }}
                  className="h-auto w-full flex-col items-stretch justify-start gap-0 rounded-none border-0 px-3 py-2.5 text-left font-normal whitespace-normal hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:ring-0 dark:hover:bg-secondary/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Text variant="label" as="span" className="truncate">
                      {entry.title}
                    </Text>
                    <Badge className="h-4 min-w-4 shrink-0 bg-critical px-1.5 text-critical-foreground">
                      {entry.count}
                    </Badge>
                  </div>
                  {entry.latest && (
                    <Text variant="small" className="mt-0.5 truncate">
                      {entry.latest.authorName}: {entry.latest.body}
                    </Text>
                  )}
                  {entry.latest?.context && (
                    <Text variant="small" className="mt-0.5 truncate">
                      · {entry.latest.context.label}
                    </Text>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
