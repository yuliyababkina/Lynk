import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAllData,
  setTicketStatusDb,
  setDocStatusDb,
  insertOnboardingCaseDb,
  deleteOnboardingCaseDb,
  onboardingSupplierId,
  upsertCatalogueDb,
  uploadSupplierDocument,
  updateSupplierProfileDb,
  submitProspectForReviewDb,
  reviewProspectDb,
  resetProspectDb,
  revokeInvitationDb,
  sendContractDb,
  setDocReviewDb,
  updateSupplierDocMetadataDb,
  deleteSupplierDocumentDb,
  acceptTermsDb,
  onboardingCaseId,
  displayExpiry,
  logActivity,
  relationshipId,
  insertChatMessageDb,
  markChatReadDb,
  deleteChatForRelationshipDb,
  type LynkDataset,
  type ProspectDecision,
} from "./db";
import { isSupabaseConfigured } from "./supabase";
import { PRINCIPAL_COMPANY, PROCUREMENT_MANAGER, PROCUREMENT_MANAGER_ROLE } from "./principal";
import { PRINCIPAL_ID } from "../data";
import type {
  Ticket,
  SupplierDoc,
  Catalogue,
  OnboardingCase,
  TicketStatus,
  DocStatus,
  ChatMessage,
  ChatContext,
  ChatSide,
} from "../types";

/** Who is writing. The app has no login, so the caller — which knows its own
 * persona — says who it is, rather than the context guessing at a current user. */
export interface ChatAuthor {
  side: ChatSide;
  name: string;
  company: string;
  role?: string;
}

interface LynkDataValue extends LynkDataset {
  loading: boolean;
  error: string | null;
  /** True when actions are actually being written to Supabase. */
  persisted: boolean;
  /** Current workflow status per ticket id (live overrides + fetched base). */
  ticketStatusById: Map<string, TicketStatus>;
  /** Move a ticket to any workflow status (To do / In progress / Resolved). */
  setTicketStatus: (ticket: Ticket, status: TicketStatus) => void;
  resolvedTicketIds: Set<string>;
  resolveTicket: (ticket: Ticket, action: string) => void;
  unresolveTicket: (ticketId: string) => void;
  /** Suppliers whose Company-info section the PM approved during review. */
  companyApprovedIds: Set<string>;
  setCompanyApproved: (supplierId: string, approved: boolean) => void;
  decideRenewal: (doc: SupplierDoc, decision: "accept" | "reject") => void;
  addOnboardingCase: (c: OnboardingCase) => void;
  /** Removes an onboarding case for good. A reason is required and is written to
   * the activity log, which is the only place it survives the deletion. An
   * un-activated prospect is removed with its documents; an accepted supplier
   * stays and only loses the case. */
  deleteOnboardingCase: (caseId: string, reason: string) => Promise<void>;
  setCatalogues: (updater: (prev: Catalogue[]) => Catalogue[]) => void;
  persistCatalogue: (c: Catalogue) => void;
  /** Supplier-portal upload: stores the PDF + inserts a pending-review doc,
   * visible immediately in both the portal and the Procurement Manager app. */
  addSupplierDoc: (
    file: File,
    supplierId: string,
    supplierName: string,
    trade?: string,
    documentName?: string,
    metadata?: { documentType?: string; issuingInstitution?: string; expiryDate?: string; doesNotExpire?: boolean }
  ) => Promise<void>;
  /** Onboarding: save the prospect's edited company profile to the DB. */
  updateSupplierProfile: (
    supplierId: string,
    patch: { name?: string; vatId?: string; address?: string; region?: string }
  ) => Promise<void>;
  /** Onboarding: submit the prospect for Procurement review. */
  submitProspectForReview: (
    supplierId: string,
    supplierName: string,
    contactName: string
  ) => Promise<void>;
  /** PM review decision on a prospect: accept (activate), request changes, or reject. */
  reviewProspect: (
    supplierId: string,
    supplierName: string,
    decision: ProspectDecision,
    note?: string
  ) => Promise<void>;
  /**
   * Reset a dead-end case (e.g. Rejected) back to the invited/awaiting state so
   * the prospect can restart from a clean application. The existing invite token
   * (magic link) is reused, not reissued.
   */
  resetProspect: (supplierId: string) => Promise<void>;
  /** Deactivates a prospect's magic link; the case stays as a Draft. */
  revokeInvitation: (caseId: string) => Promise<void>;
  /**
   * Send the Principal's contract + selected service catalogues to a prospect,
   * moving the case to "Contract Sent (Pending Signature)".
   */
  sendContract: (supplierId: string, contractName: string, catalogueNames: string[]) => Promise<void>;
  /** Per-document review: approve (→ valid) or decline (→ rejected-resubmit) with a comment. */
  reviewDocument: (docId: string, decision: "approve" | "decline", comment?: string) => void;
  /** Supplier-side correction of a document's details (type / issuer / validity).
   * The file is untouched; an already-approved document goes back to review. */
  updateDocMetadata: (
    docId: string,
    metadata: { documentType?: string; issuingInstitution?: string; expiryDate?: string; doesNotExpire?: boolean },
    actor?: string
  ) => Promise<void>;
  /** Supplier-side removal of an uploaded document, so it can be uploaded again. */
  removeSupplierDoc: (docId: string, actor?: string) => Promise<void>;
  /** Records a prospect's acceptance of the Terms & Conditions (who/version/when). */
  acceptTerms: (supplierId: string, version: string, acceptedBy: string) => Promise<void>;
  /** True when this supplier still owes a terms acceptance — no data may be
   * saved for them until then. Established suppliers have no case and are free. */
  termsPending: (supplierId: string) => boolean;

  /* Chat ------------------------------------------------------------------ */

  /** Every message in one conversation, oldest first. The ONLY way the UI reads
   * messages, so the relationship scope can't be forgotten at a call site. */
  messagesFor: (relationship: string) => ChatMessage[];
  /** The most recent message, for list previews. */
  lastMessageFor: (relationship: string) => ChatMessage | undefined;
  /** Messages from the *other* side newer than this side's read marker. */
  unreadFor: (relationship: string, side: ChatSide) => number;
  /** Total unread across every relationship this side can see — drives the bell. */
  unreadRelationships: (side: ChatSide, relationships: string[]) => { relationship: string; count: number }[];
  /** Append a message. Insert-only; there is no edit or delete counterpart. */
  sendMessage: (params: {
    relationship: string;
    body: string;
    author: ChatAuthor;
    context?: ChatContext;
  }) => Promise<void>;
  /** Marks this side caught up, and re-arms the single-email rule. */
  markChatRead: (relationship: string, side: ChatSide) => void;
}

const LynkDataCtx = createContext<LynkDataValue | null>(null);

export function LynkDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LynkDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketStatusById, setTicketStatusById] = useState<Map<string, TicketStatus>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchAllData()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setTicketStatusById(
          new Map(
            d.tickets.map((t) => [t.id, t.status ?? (t.resolved ? "Resolved" : "To do")])
          )
        );
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTicketStatus = useCallback((ticket: Ticket, status: TicketStatus) => {
    setTicketStatusById((prev) => new Map(prev).set(ticket.id, status));
    setTicketStatusDb(ticket.id, status).catch(console.error);
  }, []);

  const resolveTicket = useCallback((ticket: Ticket, action: string) => {
    setTicketStatusById((prev) => new Map(prev).set(ticket.id, "Resolved"));
    setTicketStatusDb(ticket.id, "Resolved").catch(console.error);
    logActivity(ticket.entityName, `${action} — ${ticket.title}`).catch(console.error);
  }, []);

  const unresolveTicket = useCallback((ticketId: string) => {
    setTicketStatusById((prev) => new Map(prev).set(ticketId, "To do"));
    setTicketStatusDb(ticketId, "To do").catch(console.error);
  }, []);

  const resolvedTicketIds = useMemo(
    () =>
      new Set(
        [...ticketStatusById].filter(([, s]) => s === "Resolved").map(([id]) => id)
      ),
    [ticketStatusById]
  );

  // Suppliers whose Company-info section the PM has approved during review. Shown
  // back to the prospect as an "Approved by procurement" marker. Session-local
  // (like reviewNote) until per-section review is persisted.
  const [companyApprovedIds, setCompanyApprovedIds] = useState<Set<string>>(new Set());
  const setCompanyApproved = useCallback((supplierId: string, approved: boolean) => {
    setCompanyApprovedIds((prev) => {
      const next = new Set(prev);
      if (approved) next.add(supplierId);
      else next.delete(supplierId);
      return next;
    });
  }, []);

  const decideRenewal = useCallback((doc: SupplierDoc, decision: "accept" | "reject") => {
    const nextStatus = decision === "accept" ? "valid" : "rejected-resubmit";
    setData((prev) =>
      prev
        ? {
            ...prev,
            docs: prev.docs.map((d) =>
              d.id === doc.id ? { ...d, status: nextStatus, renewal: undefined } : d
            ),
          }
        : prev
    );
    setDocStatusDb(doc.id, nextStatus).catch(console.error);
    logActivity(doc.supplierName, `Renewal ${decision}ed — ${doc.documentName}`).catch(console.error);
  }, []);

  /**
   * Narrates a lifecycle event into the conversation. Called from the mutations
   * that already exist (invite, submit, review) rather than from a new event
   * system — the five events in the spec are exactly the five places this is
   * used, and nowhere else.
   */
  const postSystemMessage = useCallback((supplierId: string, body: string, context?: ChatContext) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      relationshipId: relationshipId(PRINCIPAL_ID, supplierId),
      authorSide: "system",
      authorName: "Lynk",
      authorCompany: PRINCIPAL_COMPANY,
      body,
      context,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => (prev ? { ...prev, chatMessages: [...prev.chatMessages, message] } : prev));
    insertChatMessageDb(message).catch(console.error);
  }, []);

  /* ── Chat ─────────────────────────────────────────────────────────────── */

  /* Reading is funnelled through these three so no component ever filters the
     message list itself — requirement 1 holds because there is exactly one
     place where a relationship scope could be dropped. */
  const messagesFor = useCallback(
    (relationship: string) =>
      (data?.chatMessages ?? [])
        .filter((m) => m.relationshipId === relationship)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data?.chatMessages]
  );

  const lastMessageFor = useCallback(
    (relationship: string) => {
      const all = messagesFor(relationship);
      return all[all.length - 1];
    },
    [messagesFor]
  );

  const unreadFor = useCallback(
    (relationship: string, side: ChatSide) => {
      const marker = data?.chatReads.find((r) => r.relationshipId === relationship && r.side === side);
      const since = marker?.lastReadAt;
      return messagesFor(relationship).filter((m) => {
        // Your own messages are never unread; system notes count for both sides.
        if (m.authorSide === side) return false;
        return !since || m.createdAt > since;
      }).length;
    },
    [data?.chatReads, messagesFor]
  );

  const unreadRelationships = useCallback(
    (side: ChatSide, relationships: string[]) =>
      relationships
        .map((relationship) => ({ relationship, count: unreadFor(relationship, side) }))
        .filter((r) => r.count > 0),
    [unreadFor]
  );

  const sendMessage = useCallback(
    async ({
      relationship,
      body,
      author,
      context,
    }: {
      relationship: string;
      body: string;
      author: ChatAuthor;
      context?: ChatContext;
    }) => {
      const trimmed = body.trim();
      if (!trimmed) return;

      const message: ChatMessage = {
        // crypto.randomUUID keeps the optimistic row and the stored row the same
        // id, so the message doesn't jump or duplicate when the insert returns.
        id: crypto.randomUUID(),
        relationshipId: relationship,
        authorSide: author.side,
        authorName: author.name,
        authorCompany: author.company,
        authorRole: author.role,
        body: trimmed,
        context,
        createdAt: new Date().toISOString(),
      };

      setData((prev) => (prev ? { ...prev, chatMessages: [...prev.chatMessages, message] } : prev));
      await insertChatMessageDb(message);

      /* Requirement 2: every message is auditable. The body itself is the detail
         so the log reads usefully, and the actor is whoever actually wrote it —
         the schema's default (Sabine) would otherwise credit her with the
         supplier's words. */
      logActivity(
        author.company,
        `Chat message sent — ${author.side}`,
        trimmed.length > 200 ? `${trimmed.slice(0, 197)}…` : trimmed,
        author.name
      ).catch(console.error);

      // Sending is itself proof you've seen the thread.
      markChatReadDb(relationship, author.side).catch(console.error);
      setData((prev) =>
        prev
          ? {
              ...prev,
              chatReads: [
                ...prev.chatReads.filter(
                  (r) => !(r.relationshipId === relationship && r.side === author.side)
                ),
                { relationshipId: relationship, side: author.side, lastReadAt: message.createdAt },
              ],
            }
          : prev
      );
    },
    []
  );

  const markChatRead = useCallback((relationship: string, side: ChatSide) => {
    const now = new Date().toISOString();
    setData((prev) =>
      prev
        ? {
            ...prev,
            chatReads: [
              ...prev.chatReads.filter((r) => !(r.relationshipId === relationship && r.side === side)),
              { relationshipId: relationship, side, lastReadAt: now },
            ],
          }
        : prev
    );
    markChatReadDb(relationship, side).catch(console.error);
  }, []);

  const addOnboardingCase = useCallback(
    (c: OnboardingCase) => {
      setData((prev) =>
        prev ? { ...prev, onboardingCases: [c, ...prev.onboardingCases] } : prev
      );
      insertOnboardingCaseDb(c).catch(console.error);
      logActivity(c.companyName, "Invitation sent").catch(console.error);
      // Event 1 of 5: invited. Opens the conversation, so a prospect who follows
      // the magic link finds context rather than an empty panel.
      postSystemMessage(
        onboardingSupplierId(c.id),
        `${PROCUREMENT_MANAGER} invited ${c.companyName} to onboard with ${PRINCIPAL_COMPANY}.`
      );
    },
    [postSystemMessage]
  );

  const deleteOnboardingCase = useCallback(
    async (caseId: string, reason: string) => {
      const trimmed = reason.trim();
      if (!trimmed) throw new Error("A reason is required before an onboarding case can be deleted.");
      const onbCase = data?.onboardingCases.find((c) => c.id === caseId);
      const supplierId = onboardingSupplierId(caseId);
      // Log before the rows go: the reason is the only record left afterwards.
      await logActivity(
        onbCase?.companyName ?? caseId,
        "Onboarding case deleted",
        trimmed
      );
      const { removedProspect } = await deleteOnboardingCaseDb(caseId);

      /* The conversation goes with the case. This is the one place messages are
         ever removed, and it is not a user-facing delete: the case never having
         been in the pipeline means its correspondence goes too. The activity
         entry written above survives — it is the only record left. */
      const relationship = relationshipId(PRINCIPAL_ID, supplierId);
      await deleteChatForRelationshipDb(relationship);

      setData((prev) =>
        prev
          ? {
              ...prev,
              onboardingCases: prev.onboardingCases.filter((c) => c.id !== caseId),
              suppliers: removedProspect
                ? prev.suppliers.filter((s) => s.id !== supplierId)
                : prev.suppliers,
              docs: removedProspect ? prev.docs.filter((d) => d.supplierId !== supplierId) : prev.docs,
              chatMessages: prev.chatMessages.filter((m) => m.relationshipId !== relationship),
              chatReads: prev.chatReads.filter((r) => r.relationshipId !== relationship),
            }
          : prev
      );
    },
    [data?.onboardingCases]
  );

  const setCatalogues = useCallback((updater: (prev: Catalogue[]) => Catalogue[]) => {
    setData((prev) => (prev ? { ...prev, catalogues: updater(prev.catalogues) } : prev));
  }, []);

  /**
   * Nothing may be stored for a supplier until they have accepted the terms.
   * Established suppliers accepted during their own onboarding and are
   * backfilled by the migration, so only new prospects are actually pending.
   * Skipped entirely on the static mock dataset, which has no acceptance data.
   */
  const termsPending = useCallback(
    (supplierId: string) => {
      if (!isSupabaseConfigured) return false;
      const supplier = data?.suppliers.find((s) => s.id === supplierId);
      return Boolean(supplier) && !supplier?.termsAcceptedAt;
    },
    [data?.suppliers]
  );

  /** Throws rather than silently dropping the write — the caller shows the error. */
  const assertTermsAccepted = useCallback(
    (supplierId: string) => {
      if (termsPending(supplierId)) {
        throw new Error("The Terms & Conditions must be accepted before any data can be saved.");
      }
    },
    [termsPending]
  );

  const acceptTerms = useCallback(
    async (supplierId: string, version: string, acceptedBy: string) => {
      // Persist first: if it fails, the prospect must not appear to be through.
      await acceptTermsDb(supplierId, version, acceptedBy);
      const acceptedAt = new Date().toISOString();
      setData((prev) =>
        prev
          ? {
              ...prev,
              suppliers: prev.suppliers.map((s) =>
                s.id === supplierId
                  ? { ...s, termsAcceptedAt: acceptedAt, termsVersion: version, termsAcceptedBy: acceptedBy }
                  : s
              ),
            }
          : prev
      );
      logActivity(
        data?.suppliers.find((x) => x.id === supplierId)?.name ?? supplierId,
        `Terms & Conditions accepted (v${version})`,
        undefined,
        acceptedBy
      ).catch(console.error);
    },
    [data?.suppliers]
  );

  const addSupplierDoc = useCallback(
    async (
      file: File,
      supplierId: string,
      supplierName: string,
      trade?: string,
      documentName?: string,
      metadata?: { documentType?: string; issuingInstitution?: string; expiryDate?: string; doesNotExpire?: boolean }
    ) => {
      assertTermsAccepted(supplierId);
      const doc = await uploadSupplierDocument({ file, supplierId, supplierName, trade, documentName, metadata });
      // Replace any existing document of the same type for this supplier (a new
      // upload supersedes the previous version), then surface it at the top.
      setData((prev) =>
        prev
          ? {
              ...prev,
              docs: [
                doc,
                ...prev.docs.filter(
                  (d) => !(d.supplierId === supplierId && d.documentName === doc.documentName)
                ),
              ],
            }
          : prev
      );
      logActivity(supplierName, `Document uploaded — ${doc.documentName}`).catch(console.error);
    },
    [assertTermsAccepted]
  );

  const reviewDocument = useCallback(
    (docId: string, decision: "approve" | "decline", comment?: string) => {
      const status: DocStatus = decision === "approve" ? "valid" : "rejected-resubmit";
      const note = decision === "approve" ? undefined : comment;
      const doc = data?.docs.find((d) => d.id === docId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              docs: prev.docs.map((d) =>
                d.id === docId ? { ...d, status, statusNote: note } : d
              ),
            }
          : prev
      );
      setDocReviewDb(docId, status, note ?? null).catch(console.error);

      /* A decline is a message to the supplier, so it becomes one — with a link
         back to the document it is about. The existing statusNote behaviour is
         untouched: the comment still shows on the document itself, this only
         adds the same words to the conversation where they can be replied to. */
      if (decision === "decline" && comment?.trim() && doc) {
        sendMessage({
          relationship: relationshipId(PRINCIPAL_ID, doc.supplierId),
          body: comment.trim(),
          author: {
            side: "principal",
            name: PROCUREMENT_MANAGER,
            company: PRINCIPAL_COMPANY,
            role: PROCUREMENT_MANAGER_ROLE,
          },
          context: { type: "document", id: doc.id, label: doc.documentName },
        }).catch(console.error);
      }
    },
    [data?.docs, sendMessage]
  );

  const updateDocMetadata = useCallback(
    async (
      docId: string,
      metadata: { documentType?: string; issuingInstitution?: string; expiryDate?: string; doesNotExpire?: boolean },
      actor?: string
    ) => {
      const doc = data?.docs.find((d) => d.id === docId);
      if (!doc) throw new Error("That document is no longer available.");
      assertTermsAccepted(doc.supplierId);

      // Editing a document's details sends it (back) to review. An approved
      // doc's prior approval no longer applies to the new values; a declined
      // doc has now been corrected — either way it should await the PM again
      // rather than stay Approved or Declined.
      const wasApproved = doc.status === "valid";
      const wasDeclined = doc.status === "rejected-resubmit";
      const status: DocStatus = wasApproved || wasDeclined ? "pending-review" : doc.status;
      const statusNote = wasApproved
        ? "Details edited by supplier — awaiting review."
        : wasDeclined
          ? "Corrected by supplier — awaiting re-review."
          : doc.statusNote;
      const history = [
        ...doc.history,
        {
          date: new Date().toISOString(),
          event: `Document details edited — ${doc.documentName}`,
          actor: actor ?? doc.supplierName,
          type: "upload" as const,
        },
      ];

      await updateSupplierDocMetadataDb(docId, {
        ...metadata,
        documentCategory: metadata.documentType || doc.documentCategory,
        status,
        statusNote: statusNote ?? null,
        history,
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              docs: prev.docs.map((d) =>
                d.id === docId
                  ? {
                      ...d,
                      documentType: metadata.documentType,
                      issuingInstitution: metadata.issuingInstitution,
                      doesNotExpire: metadata.doesNotExpire ?? false,
                      expiryDate: metadata.doesNotExpire ? "" : displayExpiry(metadata.expiryDate),
                      documentCategory: metadata.documentType || d.documentCategory,
                      metadataConfirmed: true,
                      status,
                      statusNote,
                      history,
                    }
                  : d
              ),
            }
          : prev
      );
      logActivity(
        doc.supplierName,
        `Document details edited — ${doc.documentName}`,
        undefined,
        actor ?? doc.supplierName
      ).catch(console.error);
    },
    [assertTermsAccepted, data?.docs]
  );

  const removeSupplierDoc = useCallback(
    async (docId: string, actor?: string) => {
      const doc = data?.docs.find((d) => d.id === docId);
      if (!doc) return;
      assertTermsAccepted(doc.supplierId);
      await deleteSupplierDocumentDb(docId, doc.filePath);
      setData((prev) => (prev ? { ...prev, docs: prev.docs.filter((d) => d.id !== docId) } : prev));
      logActivity(
        doc.supplierName,
        `Document deleted — ${doc.documentName}`,
        undefined,
        actor ?? doc.supplierName
      ).catch(console.error);
    },
    [assertTermsAccepted, data?.docs]
  );

  const updateSupplierProfile = useCallback(
    async (
      supplierId: string,
      patch: { name?: string; vatId?: string; address?: string; region?: string }
    ) => {
      assertTermsAccepted(supplierId);
      // Optimistically reflect the edit everywhere the supplier is shown.
      setData((prev) =>
        prev
          ? {
              ...prev,
              suppliers: prev.suppliers.map((s) =>
                s.id === supplierId
                  ? {
                      ...s,
                      name: patch.name ?? s.name,
                      vatId: patch.vatId ?? s.vatId,
                      address: patch.address ?? s.address,
                      region: patch.region ?? s.region,
                    }
                  : s
              ),
            }
          : prev
      );
      await updateSupplierProfileDb(supplierId, patch);
    },
    [assertTermsAccepted]
  );

  const submitProspectForReview = useCallback(
    async (supplierId: string, supplierName: string, contactName: string) => {
      const caseId = onboardingCaseId(supplierId);
      const onbCase: OnboardingCase = {
        id: caseId,
        companyName: supplierName,
        contactName,
        status: "In Review",
        daysNoResponse: 0,
        criticality: "medium",
      };
      setData((prev) => {
        if (!prev) return prev;
        const exists = prev.onboardingCases.some((c) => c.id === caseId);
        return {
          ...prev,
          suppliers: prev.suppliers.map((s) =>
            s.id === supplierId ? { ...s, compliance: "Pending Review" } : s
          ),
          onboardingCases: exists
            ? // Merge, never replace: swapping in a fresh object dropped
              // inviteToken and email, which instantly invalidated the
              // prospect's magic link the moment they submitted.
              prev.onboardingCases.map((c) =>
                c.id === caseId ? { ...c, status: "In Review" as const, daysNoResponse: 0 } : c
              )
            : [onbCase, ...prev.onboardingCases],
        };
      });
      await submitProspectForReviewDb(supplierId, supplierName, contactName);
      // Event 5 of 5: new application. Also what a re-invited, previously
      // rejected prospect posts when they resubmit into the same conversation.
      postSystemMessage(
        supplierId,
        `${supplierName} submitted their application for review.`,
        { type: "onboarding-case", id: caseId, label: "Onboarding application" }
      );
    },
    [postSystemMessage]
  );

  const reviewProspect = useCallback(
    async (supplierId: string, supplierName: string, decision: ProspectDecision, note?: string) => {
      const caseId = onboardingCaseId(supplierId);
      const status =
        decision === "accept" ? "Accepted" : decision === "changes" ? "Changes Requested" : "Rejected";
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          suppliers: prev.suppliers.map((s) =>
            s.id === supplierId && decision === "accept"
              ? // DB stores capitalised stage values ("Supplier"); the SupplierStage
                // type is loosely lowercase, so cast to match runtime data.
                ({ ...s, stage: "Supplier", compliance: "Fully Compliant" } as unknown as typeof s)
              : s
          ),
          onboardingCases: prev.onboardingCases.map((c) =>
            c.id === caseId ? { ...c, status, reviewNote: note } : c
          ),
        };
      });
      await reviewProspectDb(supplierId, supplierName, decision, note);

      /* Events 2–4 of 5: changes requested / accepted / rejected. The PM's note
         is quoted so the prospect reads the reason in the conversation as well
         as on the wizard — reviewNote itself is untouched. */
      const caseContext: ChatContext = {
        type: "onboarding-case",
        id: caseId,
        label: "Onboarding application",
      };
      if (decision === "accept") {
        postSystemMessage(
          supplierId,
          `${PRINCIPAL_COMPANY} accepted ${supplierName}'s application. The supplier account is now active.`,
          caseContext
        );
      } else if (decision === "changes") {
        postSystemMessage(
          supplierId,
          note
            ? `${PRINCIPAL_COMPANY} requested changes: ${note}`
            : `${PRINCIPAL_COMPANY} requested changes to the application.`,
          caseContext
        );
      } else {
        postSystemMessage(
          supplierId,
          note
            ? `${PRINCIPAL_COMPANY} did not approve the application: ${note}`
            : `${PRINCIPAL_COMPANY} did not approve the application.`,
          caseContext
        );
      }
    },
    [postSystemMessage]
  );

  const resetProspect = useCallback(
    async (supplierId: string) => {
      const caseId = onboardingCaseId(supplierId);
      let name = supplierId;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboardingCases: prev.onboardingCases.map((c) => {
            if (c.id !== caseId) return c;
            name = c.companyName;
            // Back to invited/awaiting; clear the review outcome. Invite token is
            // left untouched so the same magic link keeps working.
            return { ...c, status: "Pending", reviewNote: undefined };
          }),
        };
      });
      await resetProspectDb(supplierId, name);
    },
    []
  );

  const revokeInvitation = useCallback(
    async (caseId: string) => {
      let name = caseId;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboardingCases: prev.onboardingCases.map((c) => {
            if (c.id !== caseId) return c;
            name = c.companyName;
            // Token dropped locally too, so the link stops resolving immediately.
            return { ...c, status: "Draft" as const, inviteToken: undefined };
          }),
        };
      });
      await revokeInvitationDb(caseId, name);
    },
    []
  );

  const sendContract = useCallback(
    async (supplierId: string, contractName: string, catalogueNames: string[]) => {
      const caseId = onboardingCaseId(supplierId);
      const target = data?.onboardingCases.find((c) => c.id === caseId);
      const name = target?.companyName ?? supplierId;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboardingCases: prev.onboardingCases.map((c) =>
            c.id === caseId ? { ...c, status: "Contract Sent (Pending Signature)" as const } : c
          ),
        };
      });
      await sendContractDb(supplierId, name, contractName, catalogueNames);

      /*
       * Tell the prospect their contract is waiting. Reuses the invite token so
       * the link drops them straight into the signing step — no login. Sending
       * is best-effort: the status change is already persisted, so a mail
       * failure must not roll the case back or throw at the caller.
       */
      if (target?.email && target.inviteToken) {
        try {
          const res = await fetch("/api/send-contract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: target.email,
              companyName: name,
              contactName: target.contactName,
              link: `${window.location.origin}/?invite=${target.inviteToken}`,
              contractName,
              catalogues: catalogueNames,
              principal: PRINCIPAL_COMPANY,
              sender: PROCUREMENT_MANAGER,
              senderRole: PROCUREMENT_MANAGER_ROLE,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error("[Lynk] contract email failed:", body.error ?? res.status);
          }
        } catch (e) {
          console.error("[Lynk] contract email failed:", e);
        }
      }
    },
    [data?.onboardingCases]
  );

  const persistCatalogue = useCallback((c: Catalogue) => {
    upsertCatalogueDb(c).catch(console.error);
  }, []);

  const value = useMemo<LynkDataValue | null>(() => {
    if (!data) return null;
    return {
      ...data,
      loading,
      error,
      persisted: isSupabaseConfigured,
      ticketStatusById,
      setTicketStatus,
      resolvedTicketIds,
      resolveTicket,
      unresolveTicket,
      companyApprovedIds,
      setCompanyApproved,
      decideRenewal,
      addOnboardingCase,
      deleteOnboardingCase,
      setCatalogues,
      persistCatalogue,
      addSupplierDoc,
      updateSupplierProfile,
      submitProspectForReview,
      reviewProspect,
      resetProspect,
      revokeInvitation,
      sendContract,
      reviewDocument,
      updateDocMetadata,
      removeSupplierDoc,
      acceptTerms,
      termsPending,
      messagesFor,
      lastMessageFor,
      unreadFor,
      unreadRelationships,
      sendMessage,
      markChatRead,
    };
  }, [
    data,
    loading,
    error,
    ticketStatusById,
    setTicketStatus,
    resolvedTicketIds,
    resolveTicket,
    unresolveTicket,
    companyApprovedIds,
    setCompanyApproved,
    decideRenewal,
    addOnboardingCase,
    deleteOnboardingCase,
    setCatalogues,
    persistCatalogue,
    addSupplierDoc,
    updateSupplierProfile,
    submitProspectForReview,
    reviewProspect,
    resetProspect,
    revokeInvitation,
    sendContract,
    reviewDocument,
    updateDocMetadata,
    removeSupplierDoc,
    acceptTerms,
    termsPending,
    messagesFor,
    lastMessageFor,
    unreadFor,
    unreadRelationships,
    sendMessage,
    markChatRead,
  ]);

  if (!value) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        {error ? (
          <div className="text-center max-w-sm">
            <div className="font-semibold mb-1">Couldn't load Lynk data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Loading Lynk…</div>
        )}
      </div>
    );
  }

  return <LynkDataCtx.Provider value={value}>{children}</LynkDataCtx.Provider>;
}

export function useLynkData(): LynkDataValue {
  const ctx = useContext(LynkDataCtx);
  if (!ctx) throw new Error("useLynkData must be used within LynkDataProvider");
  return ctx;
}
