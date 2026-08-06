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
  sendContractDb,
  setDocReviewDb,
  updateSupplierDocMetadataDb,
  deleteSupplierDocumentDb,
  acceptTermsDb,
  onboardingCaseId,
  displayExpiry,
  logActivity,
  type LynkDataset,
  type ProspectDecision,
} from "./db";
import { isSupabaseConfigured } from "./supabase";
import type { Ticket, SupplierDoc, Catalogue, OnboardingCase, TicketStatus, DocStatus } from "../types";

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

  const addOnboardingCase = useCallback((c: OnboardingCase) => {
    setData((prev) =>
      prev ? { ...prev, onboardingCases: [c, ...prev.onboardingCases] } : prev
    );
    insertOnboardingCaseDb(c).catch(console.error);
    logActivity(c.companyName, "Invitation sent").catch(console.error);
  }, []);

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
      setData((prev) =>
        prev
          ? {
              ...prev,
              onboardingCases: prev.onboardingCases.filter((c) => c.id !== caseId),
              suppliers: removedProspect
                ? prev.suppliers.filter((s) => s.id !== supplierId)
                : prev.suppliers,
              docs: removedProspect ? prev.docs.filter((d) => d.supplierId !== supplierId) : prev.docs,
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
    },
    []
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
            ? prev.onboardingCases.map((c) => (c.id === caseId ? onbCase : c))
            : [onbCase, ...prev.onboardingCases],
        };
      });
      await submitProspectForReviewDb(supplierId, supplierName, contactName);
    },
    []
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
    },
    []
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

  const sendContract = useCallback(
    async (supplierId: string, contractName: string, catalogueNames: string[]) => {
      const caseId = onboardingCaseId(supplierId);
      let name = supplierId;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          onboardingCases: prev.onboardingCases.map((c) => {
            if (c.id !== caseId) return c;
            name = c.companyName;
            return { ...c, status: "Contract Sent (Pending Signature)" as const };
          }),
        };
      });
      await sendContractDb(supplierId, name, contractName, catalogueNames);
    },
    []
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
      sendContract,
      reviewDocument,
      updateDocMetadata,
      removeSupplierDoc,
      acceptTerms,
      termsPending,
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
    sendContract,
    reviewDocument,
    updateDocMetadata,
    removeSupplierDoc,
    acceptTerms,
    termsPending,
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
