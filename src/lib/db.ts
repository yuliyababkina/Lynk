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
    expiryDate: metadata?.doesNotExpire ? "" : metadata?.expiryDate ?? "",
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

export async function logActivity(entityName: string | null, action: string, detail?: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("activity_log").insert({
    entity_name: entityName,
    action,
    detail: detail ?? null,
  });
  if (error) console.error("[Lynk] logActivity failed:", error.message);
}
