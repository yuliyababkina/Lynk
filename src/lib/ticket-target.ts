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

/** A record a ticket can link to — what the resolver returns. */
export type LinkedObject = Extract<TicketTarget, { kind: "document" | "contract" | "data-change" | "onboarding" }>;
export type LinkedKind = LinkedObject["kind"];

/** Which kind of record each ticket source links to. Sources not listed have no record by design. */
export const SOURCE_KIND: Partial<Record<Ticket["source"], LinkedKind>> = {
  "compliance-monitoring": "document",
  contracts: "contract",
  "data-governance": "data-change",
  onboarding: "onboarding",
};

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

function onboardingObject(caseItem: OnboardingCase, data: TicketTargetData): LinkedObject {
  const supplier = onboardingSupplierFor(caseItem, data.suppliers);
  return { kind: "onboarding", caseItem, supplier, docs: onboardingDocsFor(supplier, data.docs) };
}

/** The company a record belongs to, to check a link never crosses companies. */
function ownerOf(o: LinkedObject): string {
  switch (o.kind) {
    case "document":
      return o.doc.supplierName;
    case "contract":
      return o.contract.supplierName;
    case "data-change":
      return o.request.supplierName;
    case "onboarding":
      return o.caseItem.companyName;
  }
}

/**
 * One record by kind and id, or null. The single lookup behind both the ticket
 * panel and App.navigate ("Open in …", chat context links), so a record is
 * found the same way wherever it is opened from.
 */
export function findLinkedObject(kind: LinkedKind, id: string | undefined | null, data: TicketTargetData): LinkedObject | null {
  if (!id) return null;
  switch (kind) {
    case "document": {
      const doc = data.docs.find((d) => d.id === id);
      return doc ? { kind, doc } : null;
    }
    case "contract": {
      const contract = data.contracts.find((c) => c.id === id);
      return contract ? { kind, contract } : null;
    }
    case "data-change": {
      const request = data.dataGovernanceRequests.find((r) => r.id === id);
      return request ? { kind, request } : null;
    }
    case "onboarding": {
      const caseItem = data.onboardingCases.find((c) => c.id === id);
      return caseItem ? onboardingObject(caseItem, data) : null;
    }
  }
}

/**
 * The record a ticket is about, for every source, or null when there is none
 * to show — no record by design, a stale id, or nothing that matches safely.
 */
export function resolveTicketObject(ticket: Ticket, data: TicketTargetData): LinkedObject | null {
  const kind = SOURCE_KIND[ticket.source];
  if (!kind) return null;
  const entity = ticket.entityName;

  const linked = findLinkedObject(kind, ticket.targetId, data);
  // A target id that points at another company's record is never followed.
  if (linked) return ownerOf(linked) === entity ? linked : null;

  // No usable id: match on the company plus what the title names, only when exactly one fits.
  switch (kind) {
    case "document": {
      const subject = titleSubject(ticket.title);
      const doc = only(data.docs.filter((d) => d.supplierName === entity && d.documentName === subject));
      return doc ? { kind, doc } : null;
    }
    case "contract": {
      const ref = ticket.title.match(/[A-Z]{2,4}-\d{4}-\d{4}/)?.[0];
      const contract = ref ? only(data.contracts.filter((c) => c.supplierName === entity && c.ref === ref)) : undefined;
      return contract ? { kind, contract } : null;
    }
    case "data-change": {
      const request = only(
        data.dataGovernanceRequests.filter((r) => r.supplierName === entity && OPEN_REQUEST.includes(r.status))
      );
      return request ? { kind, request } : null;
    }
    case "onboarding": {
      const caseItem = only(data.onboardingCases.filter((c) => c.companyName === entity));
      return caseItem ? onboardingObject(caseItem, data) : null;
    }
  }
}

/** The resolver's answer as the panel uses it: the record, "not-found", or "no-object" by design. */
export function resolveTicketTarget(ticket: Ticket, data: TicketTargetData): TicketTarget {
  const object = resolveTicketObject(ticket, data);
  if (object) return object;
  return SOURCE_KIND[ticket.source] ? { kind: "not-found" } : { kind: "no-object" };
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
