import type {
  Contract,
  DataGovernanceRequest,
  OnboardingCase,
  Supplier,
  SupplierDoc,
  Ticket,
} from "../types";

/*
 * Resolves a Task Queue ticket to the one record it is about. A ticket links to
 * its record by `targetId`, but older rows have none (t3 is seeded with a null
 * target) and a target can go stale, so:
 *
 *  1. the target id is tried first, and only kept if the record belongs to the
 *     ticket's entity — a ticket must never show another company's data;
 *  2. without a usable id, the record is matched by entity plus what the title
 *     names (document name, contract ref), and only when exactly one matches;
 *  3. anything else is "not-found", and the panel says so instead of guessing.
 *
 * Profile-completeness and prospect tickets are about the company as a whole and
 * have no record by design ("no-object").
 */

export type TicketTarget =
  | { kind: "document"; doc: SupplierDoc }
  | { kind: "contract"; contract: Contract }
  | { kind: "data-change"; request: DataGovernanceRequest }
  | { kind: "onboarding"; caseItem: OnboardingCase; supplier?: Supplier; docs: SupplierDoc[] }
  | { kind: "no-object" }
  | { kind: "not-found" };

export interface TicketTargetData {
  docs: SupplierDoc[];
  contracts: Contract[];
  dataGovernanceRequests: DataGovernanceRequest[];
  onboardingCases: OnboardingCase[];
  suppliers: Supplier[];
}

/** The subject a templated title opens with: "Trade Licence — expiring in 49 days" → "Trade Licence". */
function titleSubject(title: string): string {
  return title.split(" — ")[0].trim();
}

function only<T>(list: T[]): T | undefined {
  return list.length === 1 ? list[0] : undefined;
}

const OPEN_REQUEST: DataGovernanceRequest["status"][] = ["Awaiting Review", "Endorsed — Awaiting 2nd Approval"];

/** The supplier profile an onboarding case belongs to — same rule as the Onboarding screen. */
export function onboardingSupplierFor(c: OnboardingCase, suppliers: Supplier[]): Supplier | undefined {
  return (
    suppliers.find((s) => s.id === c.id.replace(/^onb-/, "")) ?? suppliers.find((s) => s.name === c.companyName)
  );
}

/** The documents a prospect has submitted, de-duplicated by id. */
export function onboardingDocsFor(supplier: Supplier | undefined, docs: SupplierDoc[]): SupplierDoc[] {
  if (!supplier) return [];
  return Array.from(new Map(docs.filter((d) => d.supplierId === supplier.id).map((d) => [d.id, d])).values());
}

export function resolveTicketTarget(ticket: Ticket, data: TicketTargetData): TicketTarget {
  const entity = ticket.entityName;
  const byId = <T extends { id: string }>(list: T[]) =>
    ticket.targetId ? list.find((x) => x.id === ticket.targetId) : undefined;

  switch (ticket.source) {
    case "compliance-monitoring": {
      const linked = byId(data.docs);
      if (linked) return linked.supplierName === entity ? { kind: "document", doc: linked } : { kind: "not-found" };
      const subject = titleSubject(ticket.title);
      const doc = only(data.docs.filter((d) => d.supplierName === entity && d.documentName === subject));
      return doc ? { kind: "document", doc } : { kind: "not-found" };
    }
    case "contracts": {
      const linked = byId(data.contracts);
      if (linked)
        return linked.supplierName === entity ? { kind: "contract", contract: linked } : { kind: "not-found" };
      const ref = ticket.title.match(/[A-Z]{2,4}-\d{4}-\d{4}/)?.[0];
      const contract = ref
        ? only(data.contracts.filter((c) => c.supplierName === entity && c.ref === ref))
        : undefined;
      return contract ? { kind: "contract", contract } : { kind: "not-found" };
    }
    case "data-governance": {
      const linked = byId(data.dataGovernanceRequests);
      if (linked)
        return linked.supplierName === entity ? { kind: "data-change", request: linked } : { kind: "not-found" };
      const request = only(
        data.dataGovernanceRequests.filter((r) => r.supplierName === entity && OPEN_REQUEST.includes(r.status))
      );
      return request ? { kind: "data-change", request } : { kind: "not-found" };
    }
    case "onboarding": {
      const linked = byId(data.onboardingCases);
      const caseItem = linked
        ? linked.companyName === entity
          ? linked
          : undefined
        : only(data.onboardingCases.filter((c) => c.companyName === entity));
      if (!caseItem) return { kind: "not-found" };
      const supplier = onboardingSupplierFor(caseItem, data.suppliers);
      return { kind: "onboarding", caseItem, supplier, docs: onboardingDocsFor(supplier, data.docs) };
    }
    default:
      return { kind: "no-object" };
  }
}

/** The id the workspace selects for this target, so "Open in …" lands on the record. */
export function targetRecordId(target: TicketTarget): string | undefined {
  switch (target.kind) {
    case "document":
      return target.doc.id;
    case "contract":
      return target.contract.id;
    case "data-change":
      return target.request.id;
    case "onboarding":
      return target.caseItem.id;
    default:
      return undefined;
  }
}

/**
 * The Contracts workspace has no panel of its own: a contract opens in the
 * ticket panel as a ticket built from the contract. One builder, so the
 * workspace row and "Open in Contract Management" open the same thing.
 */
export function contractTicket(c: Contract): Ticket {
  return {
    id: `contract-${c.id}`,
    title: `${c.ref} — ${c.supplierName}`,
    criticality: c.status === "Renewal Urgent" ? "critical" : "medium",
    entityName: c.supplierName,
    entityType: "Supplier",
    // Not a raised task, so it has no opening date to show.
    ageLabel: "",
    primaryAction: "Renew",
    source: "contracts",
    category: "Contracts",
    targetId: c.id,
  };
}

/** True for the ticket the Contracts workspace builds for its own rows. */
export function isContractWorkspaceTicket(ticket: Ticket): boolean {
  return ticket.id.startsWith("contract-");
}
