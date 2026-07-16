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

export async function insertOnboardingCaseDb(c: OnboardingCase) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("onboarding_cases").insert({
    id: c.id,
    company_name: c.companyName,
    contact_name: c.contactName,
    status: c.status,
    days_no_response: c.daysNoResponse,
    criticality: c.criticality,
  });
  if (error) console.error("[Lynk] insertOnboardingCaseDb failed:", error.message);
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

export async function logActivity(entityName: string | null, action: string, detail?: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("activity_log").insert({
    entity_name: entityName,
    action,
    detail: detail ?? null,
  });
  if (error) console.error("[Lynk] logActivity failed:", error.message);
}
