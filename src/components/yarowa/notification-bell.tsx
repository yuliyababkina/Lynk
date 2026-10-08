import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

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
  tone = "dark",
}: {
  entries: BellEntry[];
  onOpen: (relationship: string) => void;
  /** `dark` sits on the navy header bar; `light` on a white one. */
  tone?: "dark" | "light";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  // Click-away and Escape, so the panel behaves like every other popover.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          total > 0 ? t("{count} new messages", { count: total }) : t("No new messages")
        }
        aria-expanded={open}
        aria-haspopup="menu"
        title={t("Notifications")}
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          tone === "dark"
            ? "text-brand-navy-foreground/70 hover:text-brand-navy-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white"
          >
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg"
        >
          <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
            {t("Messages")}
          </div>
          {entries.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("No new messages")}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.relationship}>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onOpen(entry.relationship);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-secondary/60 focus-visible:outline-none focus-visible:bg-secondary/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{entry.title}</span>
                      <span className="shrink-0 rounded-full bg-critical px-1.5 text-[10px] font-semibold text-white">
                        {entry.count}
                      </span>
                    </div>
                    {entry.latest && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {entry.latest.authorName}: {entry.latest.body}
                      </p>
                    )}
                    {entry.latest?.context && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        · {entry.latest.context.label}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
