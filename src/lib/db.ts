import { supabase, isSupabaseConfigured } from "./supabase";
import * as staticData from "../data";
import type {
  Supplier,
  Ticket,
  SupplierDoc,
  Contract,
  DataGovernanceRequest,
  OnboardingCase,
  Catalogue,
  CatalogueSupplier,
  DocStatus,
  TicketStatus,
  ComplianceEvent,
} from "../types";

export interface LynkDataset {
  suppliers: Supplier[];
  tickets: Ticket[];
  docs: SupplierDoc[];
  contracts: Contract[];
  dataGovernanceRequests: DataGovernanceRequest[];
  onboardingCases: OnboardingCase[];
  catalogues: Catalogue[];
}

function getStaticDataset(): LynkDataset {
  return {
    suppliers: staticData.SUPPLIERS,
    tickets: staticData.TICKETS,
    docs: staticData.DOCS,
    contracts: staticData.CONTRACTS,
    dataGovernanceRequests: staticData.DATA_GOVERNANCE_REQUESTS,
    onboardingCases: staticData.ONBOARDING_CASES,
    catalogues: staticData.CATALOGUES,
  };
}

/* ---------------------------------------------------------------------- */
/* Row → app-shape mappers (snake_case DB columns → camelCase TS types)   */
/* ---------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupplier(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    stage: row.stage,
    relationshipId: row.relationship_id ?? row.id,
    trade: row.trade,
    region: row.region,
    compliance: row.compliance,
    rating: row.rating,
    openTickets: row.open_tickets,
    contacts: row.contacts ?? [],
    regionsServed: row.regions_served ?? [],
    capabilities: row.capabilities ?? [],
    vatId: row.vat_id ?? undefined,
    iban: row.iban ?? undefined,
    address: row.address ?? undefined,
    lastActive: row.last_active ?? "",
    termsAcceptedAt: row.terms_accepted_at ?? undefined,
    termsVersion: row.terms_version ?? undefined,
    termsAcceptedBy: row.terms_accepted_by ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTicket(row: any): Ticket & { resolved?: boolean } {
  return {
    id: row.id,
    title: row.title,
    criticality: row.criticality,
    entityName: row.entity_name,
    entityType: row.entity_type,
    ageLabel: row.age_label ?? "",
    primaryAction: row.primary_action,
    source: row.source,
    category: row.category,
    targetId: row.target_id ?? undefined,
    // `status` column may not exist yet on older projects — derive from `resolved`.
    status: (row.status as Ticket["status"]) ?? (row.resolved ? "Resolved" : "To do"),
    resolved: row.resolved ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDoc(row: any): SupplierDoc {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    trade: row.trade ?? "",
    documentName: row.document_name,
    documentCategory: row.document_category ?? "",
    expiryDate: row.expiry_date ?? "",
    daysUntilExpiry: row.days_until_expiry ?? 0,
    status: row.status as DocStatus,
    autoNotified: row.auto_notified ?? undefined,
    statusNote: row.status_note ?? undefined,
    renewal: row.renewal ?? undefined,
    history: row.history ?? [],
    filePath: row.file_path ?? undefined,
    fileUrl: row.file_url ?? undefined,
    documentType: row.document_type ?? undefined,
    issuingInstitution: row.issuing_institution ?? undefined,
    doesNotExpire: row.does_not_expire ?? false,
    metadataConfirmed: row.metadata_confirmed ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContract(row: any): Contract {
  return {
    id: row.id,
    supplierName: row.supplier_name,
    ref: row.ref,
    type: row.type,
    annualValue: Number(row.annual_value),
    endDate: row.end_date,
    renewalBy: row.renewal_by,
    noticePeriod: row.notice_period,
    timeLeftLabel: row.time_left_label,
    status: row.status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDgr(row: any): DataGovernanceRequest {
  return {
    id: row.id,
    supplierName: row.supplier_name,
    category: row.category,
    risk: row.risk,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    reason: row.reason,
    fields: row.fields ?? [],
    status: row.status,
    approvalStep: row.approval_step,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOnboarding(row: any): OnboardingCase {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name ?? "",
    status: row.status,
    daysNoResponse: row.days_no_response ?? 0,
    criticality: row.criticality,
    email: row.email ?? undefined,
    inviteToken: row.invite_token ?? undefined,
  };
}

function mapCatalogue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supplierRows: any[]
): Catalogue {
  const suppliers: CatalogueSupplier[] = supplierRows.map((s) => ({
    id: s.supplier_ref,
    name: s.name,
    region: s.region ?? "",
    confirmed: s.confirmed,
  }));
  return {
    id: row.id,
    name: row.name,
    trade: row.trade,
    region: row.region,
    status: row.status,
    versionLabel: row.version_label,
    currentVersion: row.current_version,
    awaitingFirstResponse: row.awaiting_first_response ?? false,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    responseModel: row.response_model,
    services: row.services ?? [],
    versions: row.versions ?? [],
    suppliers,
  };
}

/* ---------------------------------------------------------------------- */
/* Fetch                                                                   */
/* ---------------------------------------------------------------------- */

export async function fetchAllData(): Promise<LynkDataset> {
  if (!isSupabaseConfigured) {
    // No Supabase project configured yet — keep the prototype working with
    // the original in-memory mock data (src/data.ts) until VITE_SUPABASE_URL
    // / VITE_SUPABASE_ANON_KEY are set. See .env.example.
    console.info(
      "[Lynk] Supabase env vars not set — using static mock data from src/data.ts (no persistence)."
    );
    return getStaticDataset();
  }

  const [suppliersRes, ticketsRes, docsRes, contractsRes, dgrRes, onbRes, catRes, catSuppliersRes] =
    await Promise.all([
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("tickets").select("*"),
      supabase.from("supplier_docs").select("*"),
      supabase.from("contracts").select("*"),
      supabase.from("data_governance_requests").select("*"),
      supabase.from("onboarding_cases").select("*"),
      supabase.from("catalogues").select("*"),
      supabase.from("catalogue_suppliers").select("*"),
    ]);

  const firstError = [suppliersRes, ticketsRes, docsRes, contractsRes, dgrRes, onbRes, catRes, catSuppliersRes].find(
    (r) => r.error
  )?.error;
  if (firstError) {
    throw new Error(`Supabase fetch failed: ${firstError.message}`);
  }

  const catSuppliers = catSuppliersRes.data ?? [];
  const suppliers = (suppliersRes.data ?? []).map(mapSupplier);
  const tickets = (ticketsRes.data ?? []).map(mapTicket);
  const docs = (docsRes.data ?? []).map(mapDoc);
  const contracts = (contractsRes.data ?? []).map(mapContract);
  const dataGovernanceRequests = (dgrRes.data ?? []).map(mapDgr);
  const onboardingCases = (onbRes.data ?? []).map(mapOnboarding);
  const catalogues = (catRes.data ?? []).map((c) =>
    mapCatalogue(c, catSuppliers.filter((cs) => cs.catalogue_id === c.id))
  );

  // Common early setup state: Supabase env vars are set, but tables are still
  // empty / blocked by RLS for anon reads. Keep the prototype usable.
  const allTablesEmpty =
    suppliers.length === 0 &&
    tickets.length === 0 &&
    docs.length === 0 &&
    contracts.length === 0 &&
    dataGovernanceRequests.length === 0 &&
    onboardingCases.length === 0 &&
    catalogues.length === 0;
  if (allTablesEmpty) {
    console.warn(
      "[Lynk] Supabase returned no rows for all datasets — using static mock data from src/data.ts."
    );
    return getStaticDataset();
  }

  return {
    suppliers,
    tickets,
    docs,
    contracts,
    dataGovernanceRequests,
    onboardingCases,
    catalogues,
  };
}

/* ---------------------------------------------------------------------- */
/* Mutations — every one is a no-op (besides a console note) when Supabase */
/* isn't configured, so the app never throws before the project exists.   */
/* ---------------------------------------------------------------------- */

export async function setTicketStatusDb(ticketId: string, status: TicketStatus) {
  if (!isSupabaseConfigured) return;
  const resolved = status === "Resolved";
  const resolved_at = resolved ? new Date().toISOString() : null;
  // Try to persist the full workflow status. If the `status` column doesn't
  // exist yet (migration pending), fall back to the legacy `resolved` flag so
  // resolutions still stick — To do / In progress just won't survive a reload
  // until the column is added.
  const { error } = await supabase
    .from("tickets")
    .update({ status, resolved, resolved_at })
    .eq("id", ticketId);
  if (!error) return;
  const { error: fallbackError } = await supabase
    .from("tickets")
    .update({ resolved, resolved_at })
    .eq("id", ticketId);
  if (fallbackError) console.error("[Lynk] setTicketStatusDb failed:", fallbackError.message);
}

export async function setDocStatusDb(docId: string, status: DocStatus) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("supplier_docs")
    .update({ status, renewal: null })
    .eq("id", docId);
  if (error) console.error("[Lynk] setDocStatusDb failed:", error.message);
}

/**
 * An onboarding case always needs a matching `suppliers` row. Two things depend
 * on it: `supplier_docs.supplier_id` is a foreign key onto suppliers(id), and
 * the prospect's own wizard writes its company profile onto that row. Inviting
 * a prospect used to create only the case, so the prospect's first document
 * upload failed the foreign key and the company-info save silently updated no
 * rows. Created as `Prospect`; the wizard fills in the real details.
 */
async function ensureProspectSupplier(c: OnboardingCase) {
  const supplierId = onboardingSupplierId(c.id);
  const contacts =
    c.contactName && c.contactName !== "—"
      ? [{ name: c.contactName, role: "Contact", email: c.email ?? "", phone: "", primary: true }]
      : [];
  const { error } = await supabase.from("suppliers").upsert(
    {
      id: supplierId,
      name: c.companyName,
      stage: "Prospect",
      // Not asked for at invite time; the prospect supplies them in the wizard.
      trade: "—",
      region: "—",
      compliance: "Pending Review",
      open_tickets: 0,
      contacts,
      regions_served: [],
      capabilities: [],
      last_active: "Invited",
    },
    // Never clobber an existing supplier — a re-invite must not reset their data.
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (error) console.error("[Lynk] ensureProspectSupplier failed:", error.message);
}

export async function insertOnboardingCaseDb(c: OnboardingCase) {
  if (!isSupabaseConfigured) return;
  // Must exist before the case: the prospect's uploads reference it.
  await ensureProspectSupplier(c);
  const { error } = await supabase.from("onboarding_cases").insert({
    id: c.id,
    company_name: c.companyName,
    contact_name: c.contactName,
    status: c.status,
    days_no_response: c.daysNoResponse,
    criticality: c.criticality,
    email: c.email ?? null,
    invite_token: c.inviteToken ?? null,
  });
  if (error) console.error("[Lynk] insertOnboardingCaseDb failed:", error.message);
}

/**
 * Removes an onboarding case for good — the record-keeping counterpart to
 * rejecting one (a rejection is a decision the supplier is told about and stays
 * on file; a deletion is the case never having been part of the pipeline).
 *
 * A case invited through Lynk owns a `suppliers` row that exists only to carry
 * its uploads, so deleting the case takes that prospect and its documents with
 * it — otherwise a nameless Prospect lingers in the supplier list. A prospect
 * that was already **accepted** is a real supplier: only the case is removed.
 *
 * Storage objects are left behind on purpose: the bucket policy grants no
 * DELETE, and the rows are the authority on what exists.
 */
export async function deleteOnboardingCaseDb(
  caseId: string
): Promise<{ removedProspect: boolean; removedDocs: number }> {
  const supplierId = onboardingSupplierId(caseId);
  if (!isSupabaseConfigured) return { removedProspect: false, removedDocs: 0 };

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, stage")
    .eq("id", supplierId)
    .maybeSingle();
  const isUnactivatedProspect = supplier?.stage === "Prospect";

  let removedDocs = 0;
  if (isUnactivatedProspect) {
    // Documents first: supplier_docs.supplier_id is a foreign key onto suppliers.
    const { data: docs, error: docsError } = await supabase
      .from("supplier_docs")
      .delete()
      .eq("supplier_id", supplierId)
      .select("id");
    if (docsError) throw new Error(`Deleting the prospect's documents failed: ${docsError.message}`);
    removedDocs = docs?.length ?? 0;

    const { error: supError } = await supabase.from("suppliers").delete().eq("id", supplierId);
    if (supError) throw new Error(`Deleting the prospect failed: ${supError.message}`);
  }

  const { error } = await supabase.from("onboarding_cases").delete().eq("id", caseId);
  if (error) throw new Error(`Deleting the onboarding case failed: ${error.message}`);

  return { removedProspect: isUnactivatedProspect, removedDocs };
}

// Resolves a magic-link click (?invite=<token>) back to its onboarding case.
// Used on app load — see App.tsx. Only works when Supabase is configured;
// on the static-mock fallback there's nothing to look up (mock cases have no
// real tokens), so callers should treat a null result as "not found."
export async function getOnboardingCaseByToken(token: string): Promise<OnboardingCase | null> {
  if (!isSupabaseConfigured || !token) return null;
  const { data, error } = await supabase
    .from("onboarding_cases")
    .select("*")
    .eq("invite_token", token)
    .maybeSingle();
  if (error) {
    console.error("[Lynk] getOnboardingCaseByToken failed:", error.message);
    return null;
  }
  return data ? mapOnboarding(data) : null;
}

export async function upsertCatalogueDb(c: Catalogue) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("catalogues").upsert({
    id: c.id,
    name: c.name,
    trade: c.trade,
    region: c.region,
    status: c.status,
    version_label: c.versionLabel,
    current_version: c.currentVersion,
    awaiting_first_response: c.awaitingFirstResponse,
    valid_from: c.validFrom,
    valid_to: c.validTo,
    response_model: c.responseModel,
    services: c.services,
    versions: c.versions,
  });
  if (error) {
    console.error("[Lynk] upsertCatalogueDb failed:", error.message);
    return;
  }
  // Replace this catalogue's supplier rows wholesale — simpler and safe for
  // the low write-volume this prototype sees.
  await supabase.from("catalogue_suppliers").delete().eq("catalogue_id", c.id);
  if (c.suppliers.length > 0) {
    const { error: supErr } = await supabase.from("catalogue_suppliers").insert(
      c.suppliers.map((s) => ({
        catalogue_id: c.id,
        supplier_ref: s.id,
        name: s.name,
        region: s.region,
        confirmed: s.confirmed,
      }))
    );
    if (supErr) console.error("[Lynk] upsertCatalogueDb (suppliers) failed:", supErr.message);
  }
}

const DOCUMENTS_BUCKET = "supplier-documents";

/**
 * Supplier-portal upload: pushes a PDF to Storage and inserts a matching
 * supplier_docs row as `pending-review` (a supplier-submitted compliance doc is
 * NOT self-certified — the Procurement Manager reviews it). Returns the new
 * SupplierDoc so the caller can show it immediately; the same row is read back
 * by the PM app from the shared table.
 */
const docSlug = (s: string) =>
  s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

/**
 * `supplier_docs.expiry_date` holds free text as printed on the document
 * ("31 Jan 2027", "Ongoing"), and every view shows it verbatim. A date input
 * gives ISO, so it is written in the same shape as everything else rather than
 * reading `2028-01-31` next to `31 Jan 2027`.
 */
export const displayExpiry = (v?: string) => {
  if (!v) return "";
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) return v;
  const [, y, m, d] = iso;
  const month = new Date(`${y}-${m}-01T00:00:00Z`).toLocaleString("en-GB", {
    month: "short",
    timeZone: "UTC",
  });
  return `${Number(d)} ${month} ${y}`;
};

export async function uploadSupplierDocument(params: {
  file: File;
  supplierId: string;
  supplierName: string;
  trade?: string;
  documentName?: string;
  /** Metadata the uploader reviewed and confirmed (type, issuer, validity). */
  metadata?: {
    documentType?: string;
    issuingInstitution?: string;
    expiryDate?: string;
    doesNotExpire?: boolean;
  };
}): Promise<SupplierDoc> {
  const { file, supplierId, supplierName, trade = "", documentName, metadata } = params;
  const name = documentName || file.name.replace(/\.pdf$/i, "");
  const slug = docSlug(name);
  // Deterministic per (supplier, document type): a new upload of the same type
  // REPLACES the previous version rather than piling up duplicates.
  const id = `doc-${supplierId}-${slug}`;
  const uploadedAt = new Date().toISOString();

  const doc: SupplierDoc = {
    id,
    supplierId,
    supplierName,
    trade,
    documentName: name,
    documentCategory: metadata?.documentType || "Uploaded",
    expiryDate: metadata?.doesNotExpire ? "" : displayExpiry(metadata?.expiryDate),
    daysUntilExpiry: 0,
    status: "pending-review",
    statusNote: "Uploaded by supplier — awaiting review.",
    history: [{ date: uploadedAt, event: `${name} uploaded`, actor: supplierName, type: "upload" }],
    documentType: metadata?.documentType,
    issuingInstitution: metadata?.issuingInstitution,
    doesNotExpire: metadata?.doesNotExpire ?? false,
    // The uploader reviewed the pre-filled values before submitting.
    metadataConfirmed: Boolean(metadata),
  };

  // No Supabase → return the in-memory doc so the prototype still demos.
  if (!isSupabaseConfigured) return doc;

  // Unique object path per upload: the bucket policy grants INSERT only, so
  // overwriting an existing object (upsert → UPDATE) is rejected by RLS. The
  // supplier_docs row below is the authority on which file is current; older
  // objects are simply no longer referenced.
  const storagePath = `${supplierId}/${slug}-${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf" });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: pub } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath);
  doc.filePath = storagePath;
  doc.fileUrl = pub.publicUrl;

  // Supersede ANY existing document of this type for this supplier (older
  // timestamped rows, seeded rows, etc.), then write the single current version.
  await supabase.from("supplier_docs").delete().eq("supplier_id", supplierId).eq("document_name", name);

  const base = {
    id: doc.id,
    supplier_id: supplierId,
    supplier_name: supplierName,
    trade,
    document_name: name,
    document_category: doc.documentCategory,
    expiry_date: doc.expiryDate || null,
    days_until_expiry: 0,
    status: doc.status,
    status_note: doc.statusNote,
    history: doc.history,
    file_path: doc.filePath,
    file_url: doc.fileUrl,
  };

  const { error: insertError } = await supabase.from("supplier_docs").insert({
    ...base,
    document_type: doc.documentType ?? null,
    issuing_institution: doc.issuingInstitution ?? null,
    does_not_expire: doc.doesNotExpire ?? false,
    metadata_confirmed: doc.metadataConfirmed ?? false,
  });
  if (!insertError) return doc;

  // Metadata columns may not exist yet (migration pending) — fall back to the
  // base row so uploads still work. See supabase/migrations/…_add_document_metadata.sql
  console.warn("[Lynk] document metadata columns unavailable, saving without them:", insertError.message);
  const { error: fallbackError } = await supabase.from("supplier_docs").insert(base);
  if (fallbackError) throw new Error(`Saving document failed: ${fallbackError.message}`);

  return doc;
}

/** Per-document review decision (PM approves or declines one uploaded doc).
 *   approve → status "valid"
 *   decline → status "rejected-resubmit" + note (feedback shown to supplier) */
export async function setDocReviewDb(docId: string, status: DocStatus, note: string | null) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("supplier_docs")
    .update({ status, status_note: note })
    .eq("id", docId);
  if (error) console.error("[Lynk] setDocReviewDb failed:", error.message);
}

/**
 * Supplier-side correction of what a document *says* — type, issuer, validity —
 * without touching the file itself. Values entered here are human-confirmed, so
 * they outrank anything `pdf-metadata` read out of the text layer.
 *
 * Editing the details of an already-approved document invalidates that approval,
 * so the caller passes the reset status/note; the file stays as it is.
 */
export async function updateSupplierDocMetadataDb(
  docId: string,
  patch: {
    documentType?: string;
    issuingInstitution?: string;
    expiryDate?: string;
    doesNotExpire?: boolean;
    documentCategory?: string;
    status?: DocStatus;
    statusNote?: string | null;
    history?: ComplianceEvent[];
  }
) {
  if (!isSupabaseConfigured) return;
  const base: Record<string, unknown> = {
    expiry_date: patch.doesNotExpire ? null : displayExpiry(patch.expiryDate) || null,
  };
  if (patch.documentCategory !== undefined) base.document_category = patch.documentCategory;
  if (patch.status !== undefined) base.status = patch.status;
  if (patch.statusNote !== undefined) base.status_note = patch.statusNote;
  if (patch.history !== undefined) base.history = patch.history;

  const { error } = await supabase
    .from("supplier_docs")
    .update({
      ...base,
      document_type: patch.documentType ?? null,
      issuing_institution: patch.issuingInstitution ?? null,
      does_not_expire: patch.doesNotExpire ?? false,
      metadata_confirmed: true,
    })
    .eq("id", docId);
  if (!error) return;

  // Same fallback as the upload path: the metadata columns may not exist yet, in
  // which case category + expiry are all the schema can hold. See
  // supabase/migrations/…_add_document_metadata.sql — until it is applied, the
  // type/issuer the supplier confirms here cannot be stored.
  console.warn("[Lynk] document metadata columns unavailable, saving without them:", error.message);
  const { error: fallbackError } = await supabase.from("supplier_docs").update(base).eq("id", docId);
  if (fallbackError) throw new Error(`Saving the document details failed: ${fallbackError.message}`);
}

/**
 * Removes an uploaded document. The `supplier_docs` row is the authority on what
 * exists, so deleting it is what makes the document gone; the Storage object is
 * removed on a best-effort basis only — the bucket policy grants SELECT/INSERT
 * but no DELETE, so an orphaned object is expected and harmless.
 */
export async function deleteSupplierDocumentDb(docId: string, filePath?: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("supplier_docs").delete().eq("id", docId);
  if (error) throw new Error(`Deleting the document failed: ${error.message}`);
  if (filePath) {
    const { error: rmError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    if (rmError) console.warn("[Lynk] storage object kept (no delete policy):", rmError.message);
  }
}

/** Onboarding: persist the prospect's edited company profile to the suppliers
 * row. Only columns that exist in the schema are written (legalName→name,
 * vatId→vat_id, composed address→address). */
export async function updateSupplierProfileDb(
  supplierId: string,
  patch: { name?: string; vatId?: string; address?: string }
) {
  if (!isSupabaseConfigured) return;
  const row: Record<string, string> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.vatId !== undefined) row.vat_id = patch.vatId;
  if (patch.address !== undefined) row.address = patch.address;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("suppliers").update(row).eq("id", supplierId);
  if (error) console.error("[Lynk] updateSupplierProfileDb failed:", error.message);
}

/** Deterministic onboarding-case id for a prospect, so submitting is idempotent
 * (re-submitting updates the same row instead of creating duplicates). */
export const onboardingCaseId = (supplierId: string) => `onb-${supplierId}`;
/** Inverse of onboardingCaseId — the supplier a case belongs to. */
export const onboardingSupplierId = (caseId: string) => caseId.replace(/^onb-/, "");

/**
 * Records the prospect's acceptance of the Terms & Conditions: who, which
 * version, and when. Nothing may be saved for them until this succeeds, so a
 * failure is thrown rather than logged — the caller must surface it instead of
 * letting the prospect proceed on an acceptance that was never stored.
 */
export async function acceptTermsDb(supplierId: string, version: string, acceptedBy: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("suppliers")
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: version,
      terms_accepted_by: acceptedBy,
    })
    .eq("id", supplierId);
  if (error) {
    throw new Error(
      `Could not record your acceptance: ${error.message}. ` +
        "If this mentions a missing column, run supabase/migrations/2026-07-31_add_terms_acceptance.sql."
    );
  }
}

/** Onboarding: mark a prospect's submission as received. Flags the supplier as
 * `Pending Review`, adds/updates the prospect's row in the Procurement Manager's
 * Onboarding list, and records the submission in the activity log — the company
 * data + documents are already persisted by this point, so the whole application
 * is now in the database. */
export async function submitProspectForReviewDb(
  supplierId: string,
  supplierName: string,
  contactName: string
) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("suppliers")
    .update({ compliance: "Pending Review" })
    .eq("id", supplierId);
  if (error) console.error("[Lynk] submitProspectForReviewDb failed:", error.message);

  const { error: onbError } = await supabase.from("onboarding_cases").upsert({
    id: onboardingCaseId(supplierId),
    company_name: supplierName,
    contact_name: contactName,
    status: "In Review",
    days_no_response: 0,
    criticality: "medium",
  });
  if (onbError) console.error("[Lynk] submitProspectForReviewDb (onboarding_case) failed:", onbError.message);

  await logActivity(supplierName, "Onboarding submitted for review");
}

export type ProspectDecision = "accept" | "changes" | "reject";

/** PM review outcome for a prospect's onboarding submission (see the onboarding
 * flow diagram). Persists the state transition:
 *   • accept  → supplier goes live (stage Prospect→Supplier), case "Accepted"
 *   • changes → case "Changes Requested" (prospect loops back to edit/resubmit)
 *   • reject  → case "Rejected" (terminal)
 * `note` is the PM's feedback/reason and is recorded in the activity log. */
export async function reviewProspectDb(
  supplierId: string,
  supplierName: string,
  decision: ProspectDecision,
  note?: string
) {
  if (!isSupabaseConfigured) return;

  if (decision === "accept") {
    const { error } = await supabase
      .from("suppliers")
      .update({ stage: "Supplier", compliance: "Fully Compliant" })
      .eq("id", supplierId);
    if (error) console.error("[Lynk] reviewProspectDb (accept) failed:", error.message);
  }

  const status =
    decision === "accept" ? "Accepted" : decision === "changes" ? "Changes Requested" : "Rejected";
  const { error: onbError } = await supabase
    .from("onboarding_cases")
    .update({ status })
    .eq("id", onboardingCaseId(supplierId));
  if (onbError) console.error("[Lynk] reviewProspectDb (case) failed:", onbError.message);

  const action =
    decision === "accept"
      ? "Onboarding accepted — supplier activated"
      : decision === "changes"
        ? "Changes requested"
        : "Application rejected";
  await logActivity(supplierName, action, note);
}

/**
 * `actor` defaults to the Procurement Manager in the schema, which is right for
 * everything the PM does — but wrong for actions the supplier takes (accepting
 * terms, uploading). Pass it explicitly in those cases so the audit trail names
 * the person who actually acted.
 */
export async function logActivity(
  entityName: string | null,
  action: string,
  detail?: string,
  actor?: string
) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("activity_log").insert({
    entity_name: entityName,
    action,
    detail: detail ?? null,
    ...(actor ? { actor } : {}),
  });
  if (error) console.error("[Lynk] logActivity failed:", error.message);
}
