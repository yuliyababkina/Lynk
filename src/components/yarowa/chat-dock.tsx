import { useCallback, useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/yarowa/chat-panel";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLynkData, type ChatAuthor } from "@/lib/LynkDataContext";
import { useMediaQuery } from "@/lib/use-media-query";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ChatContext, ChatSide } from "@/types";

/*
 * The one chat surface, used by all three shells (PM app, supplier portal,
 * prospect wizard).
 *
 * On desktop it is a plain flex-row sibling of the page's main content — not a
 * portal, no backdrop, no focus trap, no scroll lock — so opening a
 * conversation pushes the page aside and everything beside it stays usable.
 * The shell keeps `min-w-0` on its main column for that to reflow rather than
 * overflow.
 *
 * Below CHAT_DOCK_BREAKPOINT there isn't room for two columns, so the same
 * conversation is handed to a full-height Sheet instead.
 */

/** Where the push layout stops being usable: the codebase's classical `lg`. */
export const CHAT_DOCK_BREAKPOINT = "(min-width: 1024px)";

/** The fixed rail width, matching the DetailDrawer the drawers already use. */
const DOCK_WIDTH = "w-[380px]";

/**
 * One open conversation. Whoever opens the chat describes it in full — the
 * dock itself knows nothing about roles, which is what keeps one principal's
 * thread out of another's: the caller passes the already-scoped relationship.
 */
export interface ChatConversation {
  /** `relationshipId(principalId, supplierId)` — scopes the thread. */
  relationship: string;
  /** Which side is reading, so the panel knows what counts as "mine". */
  side: ChatSide;
  /** Who a message sent from here is from. */
  author: ChatAuthor;
  /** The context line: the supplier, the principal, the application. */
  title: string;
  subtitle?: string;
  /** Set when the relationship takes no new messages but stays readable. */
  readOnlyReason?: string;
  draft?: string;
  draftContext?: ChatContext;
  /** Navigation only — opening the thing a message links to. */
  onOpenContext?: (context: ChatContext) => void;
}

/**
 * Holds the shell's single open conversation. Opening another one while the
 * dock is up simply replaces it, so there is never a second panel.
 */
export function useChatDock() {
  const { markChatRead } = useLynkData();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);

  const open = useCallback(
    (next: ChatConversation) => {
      setConversation(next);
      // Opening is what marks it read — and re-arms the unread notification.
      markChatRead(next.relationship, next.side);
    },
    [markChatRead]
  );

  const close = useCallback(() => setConversation(null), []);

  return { conversation, open, close };
}

export function ChatDock({
  conversation,
  onClose,
}: {
  conversation: ChatConversation | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { messagesFor, sendMessage } = useLynkData();
  const wide = useMediaQuery(CHAT_DOCK_BREAKPOINT);
  const open = conversation !== null;

  /* The last conversation stays mounted after closing, so the rail collapses
     with its content still in it rather than emptying first. While closed the
     element is inert and aria-hidden, so nothing in there can be tabbed into
     and the thread's live region can't announce into a shut panel. */
  const previous = useRef<ChatConversation | null>(null);
  if (conversation) previous.current = conversation;
  const shown = conversation ?? previous.current;

  const railRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (open) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [open]);

  const panel = shown ? (
    <ChatPanel
      className="h-full min-h-0"
      messages={messagesFor(shown.relationship)}
      side={shown.side}
      title={shown.title}
      subtitle={shown.subtitle}
      readOnlyReason={shown.readOnlyReason}
      draft={shown.draft}
      draftContext={shown.draftContext}
      onClose={onClose}
      onSend={(body, context) =>
        sendMessage({
          relationship: shown.relationship,
          body,
          author: shown.author,
          context,
        })
      }
      onOpenContext={shown.onOpenContext}
    />
  ) : null;

  if (!wide) {
    return (
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent
          side="right"
          /* The panel carries its own header, so the Sheet contributes only the
             title screen readers need to announce the dialog. */
          aria-describedby={undefined}
          className={cn("gap-0 p-0 sm:max-w-none", DOCK_WIDTH, "max-w-[85vw]")}
        >
          <SheetTitle className="sr-only">{t("Conversation")}</SheetTitle>
          {panel}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      ref={railRef}
      aria-hidden={!open}
      className={cn(
        /* `relative` is load-bearing: the thread holds absolutely positioned
           descendants (every `sr-only` label is one), and a static box is not
           their containing block, so `overflow-hidden` would not clip them —
           they'd stick out of the collapsed rail and scroll the page. */
        "relative h-full shrink-0 overflow-hidden bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none",
        open ? cn(DOCK_WIDTH, "border-l border-border") : "w-0"
      )}
    >
      {/* Fixed width inside the animating box, so the thread is revealed rather
          than reflowed on every frame of the transition. */}
      <div className={cn("flex h-full min-h-0 flex-col", DOCK_WIDTH)}>{panel}</div>
    </aside>
  );
}
