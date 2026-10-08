import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Lock, Send, SlidersHorizontal, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ChatContext, ChatMessage, ChatSide } from "@/types";

/*
 * The one conversation view, used by all three roles. It renders a single
 * relationship's messages and knows nothing about who is talking to whom —
 * callers pass the already-scoped list and say which side is reading, which is
 * what keeps one principal's thread out of another's (requirement 1).
 *
 * It holds no files and changes no data (requirement 4): a context chip only
 * navigates, via onOpenContext.
 */

export interface ChatPanelProps {
  /** Already scoped to one relationship by the caller. */
  messages: ChatMessage[];
  /** Which side is reading — decides alignment and what counts as "mine". */
  side: ChatSide;
  /** Shown above the thread, e.g. the principal or the supplier company. */
  title: string;
  subtitle?: string;
  onSend?: (body: string, context?: ChatContext) => void | Promise<void>;
  /** Opening the thing a message is about. Navigation only — never an action. */
  onOpenContext?: (context: ChatContext) => void;
  /**
   * Set when the relationship can no longer be written to (rejected, inactive).
   * The thread stays readable — the history is the point — and the composer is
   * replaced by this explanation.
   */
  readOnlyReason?: string;
  /** Pre-filled composer text, e.g. when opened from a ticket's Chat button. */
  draft?: string;
  /** Pre-attached context, travelling with that draft. */
  draftContext?: ChatContext;
  className?: string;
}

const CONTEXT_ICON: Record<ChatContext["type"], typeof FileText> = {
  document: FileText,
  "data-change": SlidersHorizontal,
  "onboarding-case": ClipboardList,
};

/** Date header text: Today / Yesterday / an explicit date for anything older. */
function dayLabel(iso: string, t: (s: string, v?: Record<string, string | number>) => string): string {
  const d = new Date(iso);
  const today = new Date();
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(today) - midnight(d)) / 86_400_000);
  if (days === 0) return t("Today");
  if (days === 1) return t("Yesterday");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Same initials-avatar treatment the header and sidebar already use. */
function Initials({ name, muted }: { name: string; muted?: boolean }) {
  const initials = name
    .split(" ")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "w-7 h-7 shrink-0 rounded-full text-xs font-semibold flex items-center justify-center",
        muted ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
      )}
    >
      {initials}
    </span>
  );
}

function ContextChip({
  context,
  onOpen,
}: {
  context: ChatContext;
  onOpen?: (c: ChatContext) => void;
}) {
  const { t } = useI18n();
  const Icon = CONTEXT_ICON[context.type];
  const label =
    context.type === "document"
      ? t("Open document")
      : context.type === "data-change"
        ? t("Open request")
        : t("Open application");

  return (
    <button
      type="button"
      onClick={() => onOpen?.(context)}
      disabled={!onOpen}
      className={cn(
        "mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-xs",
        onOpen && "hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      title={onOpen ? label : undefined}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{context.label}</span>
      {onOpen && <span className="shrink-0 text-muted-foreground">· {label}</span>}
    </button>
  );
}

/** A lifecycle note — centred, no avatar, visually not a person talking. */
function SystemRow({
  message,
  onOpenContext,
}: {
  message: ChatMessage;
  onOpenContext?: (c: ChatContext) => void;
}) {
  return (
    <li className="flex flex-col items-center text-center">
      <div className="max-w-[85%] rounded-lg bg-secondary/60 px-3 py-2">
        <p className="text-xs text-muted-foreground">{message.body}</p>
        {message.context && <ContextChip context={message.context} onOpen={onOpenContext} />}
      </div>
      <span className="mt-1 text-[11px] text-muted-foreground">{time(message.createdAt)}</span>
    </li>
  );
}

function MessageRow({
  message,
  mine,
  onOpenContext,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpenContext?: (c: ChatContext) => void;
}) {
  const { t } = useI18n();
  return (
    <li className={cn("flex gap-2", mine && "flex-row-reverse")}>
      <Initials name={message.authorName} muted={!mine} />
      <div className={cn("min-w-0 max-w-[80%]", mine && "items-end text-right")}>
        {/* Requirement 5: company, person, role — in that order, every message. */}
        <div className={cn("flex flex-wrap items-baseline gap-x-1.5", mine && "justify-end")}>
          <span className="text-xs font-semibold">
            {message.authorCompany} <span className="text-muted-foreground">|</span> {message.authorName}
            {message.authorInactive && (
              <span className="font-normal text-muted-foreground"> ({t("inactive")})</span>
            )}
          </span>
          {message.authorRole && (
            <span className="text-[11px] text-muted-foreground">{message.authorRole}</span>
          )}
        </div>
        <div
          className={cn(
            "mt-1 inline-block rounded-lg px-3 py-2 text-left",
            mine ? "bg-primary text-primary-foreground" : "bg-secondary"
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
        </div>
        {message.context && (
          <div className={cn(mine && "flex justify-end")}>
            <ContextChip context={message.context} onOpen={onOpenContext} />
          </div>
        )}
        <div className="mt-0.5 text-[11px] text-muted-foreground">{time(message.createdAt)}</div>
      </div>
    </li>
  );
}

export function ChatPanel({
  messages,
  side,
  title,
  subtitle,
  onSend,
  onOpenContext,
  readOnlyReason,
  draft = "",
  draftContext,
  className,
}: ChatPanelProps) {
  const { t } = useI18n();
  const [body, setBody] = useState(draft);
  const [context, setContext] = useState<ChatContext | undefined>(draftContext);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set(messages.map((m) => m.id)));
  const [announcement, setAnnouncement] = useState("");

  // Opening from a different ticket replaces whatever was half-typed for the
  // previous one, rather than silently keeping the old draft and its link.
  useEffect(() => {
    setBody(draft);
    setContext(draftContext);
  }, [draft, draftContext]);

  /* Screen readers get told about messages that arrive from the other side.
     Your own send is not announced — you already know what you just wrote. */
  useEffect(() => {
    const incoming = messages.filter((m) => !seenIds.current.has(m.id) && m.authorSide !== side);
    messages.forEach((m) => seenIds.current.add(m.id));
    const latest = incoming[incoming.length - 1];
    if (latest) {
      setAnnouncement(
        t("New message from {sender}: {body}", { sender: latest.authorName, body: latest.body })
      );
    }
  }, [messages, side, t]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Group by calendar day so the thread gets dividers rather than a flat run.
  const days = useMemo(() => {
    const out: { key: string; label: string; items: ChatMessage[] }[] = [];
    for (const m of messages) {
      const key = m.createdAt.slice(0, 10);
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(m);
      else out.push({ key, label: dayLabel(m.createdAt, t), items: [m] });
    }
    return out;
  }, [messages, t]);

  const canSend = body.trim().length > 0 && !sending && !readOnlyReason;

  async function submit() {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend?.(body.trim(), context);
      setBody("");
      setContext(undefined);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={cn("flex min-h-0 flex-col", className)} aria-label={t("Conversation")}>
      <header className="shrink-0 border-b border-border px-4 py-3">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </header>

      {/* Polite, so a message arriving mid-task doesn't interrupt the reader. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("No messages yet. Start the conversation below.")}
          </p>
        ) : (
          days.map((day) => (
            <div key={day.key}>
              <div className="my-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-medium text-muted-foreground">{day.label}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <ul className="space-y-4">
                {day.items.map((m) =>
                  m.authorSide === "system" ? (
                    <SystemRow key={m.id} message={m} onOpenContext={onOpenContext} />
                  ) : (
                    <MessageRow
                      key={m.id}
                      message={m}
                      mine={m.authorSide === side}
                      onOpenContext={onOpenContext}
                    />
                  )
                )}
              </ul>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <footer className="shrink-0 border-t border-border p-3">
        {readOnlyReason ? (
          <div className="flex items-start gap-2 rounded-lg bg-secondary/60 px-3 py-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{readOnlyReason}</p>
          </div>
        ) : (
          <>
            {context && (
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="neutral" className="min-w-0">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{context.label}</span>
                </Badge>
                <button
                  type="button"
                  onClick={() => setContext(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("Remove link")}
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line — the convention
                  // the decline-comment field already uses.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                aria-label={t("Write a message")}
                placeholder={t("Write a message…")}
                className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-background p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button variant="dark" size="sm" disabled={!canSend} onClick={submit}>
                <Send className="h-4 w-4" />
                <span className="sr-only">{t("Send")}</span>
              </Button>
            </div>
          </>
        )}
      </footer>
    </section>
  );
}
