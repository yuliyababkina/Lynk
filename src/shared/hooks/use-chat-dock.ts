import { useCallback, useState } from "react";
import { useLynkData } from "@/lib/lynk-data-context";
import type { ChatAuthor } from "@/lib/LynkDataContext";
import type { ChatContext, ChatSide } from "@/types";

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
