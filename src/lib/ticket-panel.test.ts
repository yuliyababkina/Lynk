import { describe, expect, it } from "vitest";
import type { Contract, DataGovernanceRequest, OnboardingCase, Supplier, SupplierDoc, Ticket } from "../types";
import type { TVars } from "./i18n";
import { contractEndPhrase, duePhrase, expiryPhrase, parseDisplayDate, renewalDueDays } from "./date-phrases";
import { resolveTicketTarget, type TicketTargetData } from "./ticket-target";
import { buildPanelModel, onboardingStage } from "./ticket-panel";
import { STANDARD_DOCUMENT_TYPES } from "./onboarding-documents";

/*
 * LYNK-117: the ticket panel shows the record a ticket is about, never another
 * company's, and its alert, actions and footer follow the record's status.
 */

const t = (s: string, vars?: TVars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

const ticket = (over: Partial<Ticket>): Ticket => ({
  id: "t1",
  title: "Trade Licence — expiring in 49 days",
  criticality: "medium",
  entityName: "Müller Logistik KG",
  entityType: "Supplier",
  ageLabel: "3 days ago",
  primaryAction: "Remind",
  source: "compliance-monitoring",
  category: "Document compliance",
  ...over,
});

const doc = (over: Partial<SupplierDoc>): SupplierDoc => ({
  id: "doc-004",
  supplierId: "muellerlogistik",
  supplierName: "Müller Logistik KG",
  trade: "Logistics",
  documentName: "Trade Licence",
  documentCategory: "Licence",
  expiryDate: "6 Aug 2026",
  daysUntilExpiry: 49,
  status: "warning-60",
  history: [],
  ...over,
});

const contract = (over: Partial<Contract>): Contract => ({
  id: "c7",
  supplierName: "Thiel Metallbau GmbH",
  ref: "FWK-2025-0099",
  type: "Framework",
  annualValue: 265000,
  endDate: "18 Jul 2026",
  renewalBy: "19 Apr 2026",
  noticePeriod: "90d",
  timeLeftLabel: "8d left",
  status: "Renewal Urgent",
  ...over,
});

const request = (over: Partial<DataGovernanceRequest>): DataGovernanceRequest => ({
  id: "dgr-1",
  supplierName: "BauParts GmbH",
  category: "Payment Data",
  risk: "Critical",
  requestedBy: "Laura Heinz",
  requestedAt: "18 Jun 2026, 09:14",
  reason: "Bank migrated.",
  fields: [{ label: "IBAN", before: "•••• 130 00", after: "DE45 1203", sensitive: true }],
  status: "Awaiting Review",
  approvalStep: 1,
  ...over,
});

const onbCase = (over: Partial<OnboardingCase>): OnboardingCase => ({
  id: "onb-1",
  companyName: "Bauer Sanitär GmbH",
  contactName: "Klaus Bauer",
  status: "Stale",
  daysNoResponse: 31,
  criticality: "high",
  ...over,
});

const data = (over: Partial<TicketTargetData> = {}): TicketTargetData => ({
  docs: [],
  contracts: [],
  dataGovernanceRequests: [],
  onboardingCases: [],
  suppliers: [],
  ...over,
});

describe("date phrases", () => {
  it("reads the stored display dates", () => {
    expect(parseDisplayDate("18 Jul 2026")).toBe(Date.UTC(2026, 6, 18));
    expect(parseDisplayDate("Ongoing")).toBeNull();
  });

  it("phrases an expiry, never a bare number", () => {
    expect(expiryPhrase(55, "12 Aug 2026", t)).toBe("Expires in 55 days · 12 Aug 2026");
    expect(expiryPhrase(-3, "7 Jul 2026", t)).toBe("Expired 3 days ago · 7 Jul 2026");
    expect(expiryPhrase(0, "7 Jul 2026", t)).toBe("Expires today · 7 Jul 2026");
  });

  it("puts the renewal deadline on the contract's own clock", () => {
    // 8 days left, renewal was due 90 days before the end → 82 days ago.
    expect(renewalDueDays("8d left", "19 Apr 2026", "18 Jul 2026")).toBe(-82);
    expect(duePhrase(-82, "19 Apr 2026", t)).toBe("Was due 82 days ago · 19 Apr 2026");
    expect(contractEndPhrase(8, "18 Jul 2026", t)).toBe("Ends in 8 days · 18 Jul 2026");
    expect(contractEndPhrase(null, "31 Jan 2024", t)).toBe("Ended · 31 Jan 2024");
  });
});

describe("resolveTicketTarget", () => {
  it("follows the target id", () => {
    const d = doc({});
    expect(resolveTicketTarget(ticket({ targetId: "doc-004" }), data({ docs: [d] }))).toEqual({
      kind: "document",
      doc: d,
    });
  });

  it("never shows another company's record behind a target id", () => {
    const other = doc({ supplierName: "BauParts GmbH" });
    expect(resolveTicketTarget(ticket({ targetId: "doc-004" }), data({ docs: [other] })).kind).toBe("not-found");
  });

  it("matches a ticket without a target by entity and document name", () => {
    const d = doc({});
    const target = resolveTicketTarget(ticket({ targetId: undefined }), data({ docs: [d] }));
    expect(target).toEqual({ kind: "document", doc: d });
  });

  it("does not guess across companies (t3: Riedel's declaration is not BauParts')", () => {
    const bauparts = doc({ id: "doc-002", supplierName: "BauParts GmbH", documentName: "Conflict Minerals Declaration" });
    const t3 = ticket({
      title: "Conflict Minerals Declaration — rejected, resubmission pending",
      entityName: "Riedel Fertigungen GmbH",
      targetId: undefined,
    });
    expect(resolveTicketTarget(t3, data({ docs: [bauparts] })).kind).toBe("not-found");
  });

  it("matches a contract by the ref in its title", () => {
    const c = contract({});
    const tk = ticket({
      source: "contracts",
      title: "Framework Contract FWK-2025-0099 — 8 days to expiry",
      entityName: "Thiel Metallbau GmbH",
    });
    expect(resolveTicketTarget(tk, data({ contracts: [c] }))).toEqual({ kind: "contract", contract: c });
  });

  it("links an onboarding case to its submitted profile", () => {
    const c = onbCase({ id: "onb-bauer" });
    const s = { id: "bauer", name: "Bauer Sanitär GmbH" } as Supplier;
    const d = doc({ id: "d1", supplierId: "bauer" });
    const tk = ticket({ source: "onboarding", entityName: "Bauer Sanitär GmbH", targetId: "onb-bauer" });
    expect(resolveTicketTarget(tk, data({ onboardingCases: [c], suppliers: [s], docs: [d] }))).toEqual({
      kind: "onboarding",
      caseItem: c,
      supplier: s,
      docs: [d],
    });
  });

  it("has no record for profile tasks", () => {
    expect(resolveTicketTarget(ticket({ source: "data-quality" }), data()).kind).toBe("no-object");
  });
});

describe("buildPanelModel — compliance", () => {
  const model = (d: SupplierDoc) => buildPanelModel(ticket({}), "To do", { kind: "document", doc: d }, t);

  it("warning-60: reminder is the one recommendation, Escalate + Chat", () => {
    const m = model(doc({}));
    expect(m.objectLabel).toBe("Document");
    expect(m.facts).toEqual([{ label: "Document expires", value: "Expires in 49 days · 6 Aug 2026" }]);
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([["doc-remind", "primary"]]);
    expect(m.escalate).toBe(true);
  });

  it("warning-30: says when the supplier was auto-notified", () => {
    const m = model(doc({ status: "warning-30", autoNotified: "3 Jul 2026", daysUntilExpiry: 23 }));
    expect(m.facts[1]).toEqual({ label: "Supplier auto-notified", value: "3 Jul 2026" });
    expect(m.alert?.title).toBe("Supplier was auto-notified");
  });

  it("pending-review: review card, no actions, Chat only", () => {
    const m = model(
      doc({
        status: "pending-review",
        renewal: { fileName: "f.pdf", fileSize: "1 MB", uploadedAt: "28 Jun 2026, 08:30", uploadedBy: "Anna" },
      })
    );
    expect(m.facts.map((f) => f.label)).toEqual(["Current document expires", "Renewal uploaded"]);
    expect(m.renewalReview).toBe(true);
    expect(m.actions).toEqual([]);
    expect(m.escalate).toBe(false);
  });

  it("rejected-resubmit: shows the reason; Revoke is separate and destructive", () => {
    const m = model(
      doc({
        status: "rejected-resubmit",
        history: [{ date: "04 Mar 2026", event: "Rejected — missing signature page", actor: "Sabine", type: "blocked" }],
      })
    );
    expect(m.alert?.body).toContain("missing signature page");
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([
      ["doc-remind", "primary"],
      ["doc-revoke", "destructive"],
    ]);
  });

  it("blocked: expired phrase and blocked-since, no revoke", () => {
    const m = model(
      doc({
        status: "blocked",
        daysUntilExpiry: -3,
        expiryDate: "7 Jul 2026",
        history: [{ date: "07 Jul 2026", event: "Document expired — supplier blocked from work orders", actor: "System", type: "blocked" }],
      })
    );
    expect(m.facts).toEqual([
      { label: "Document expired", value: "Expired 3 days ago · 7 Jul 2026", tone: "danger" },
      { label: "Supplier blocked since", value: "07 Jul 2026" },
    ]);
    expect(m.actions.map((a) => a.id)).toEqual(["doc-remind"]);
    expect(m.escalate).toBe(true);
  });

  it("valid: no action needed, Chat only", () => {
    const m = model(doc({ status: "valid" }));
    expect(m.alert?.title).toBe("No action needed");
    expect(m.actions).toEqual([]);
    expect(m.escalate).toBe(false);
  });

  it("newest history first", () => {
    const m = model(
      doc({
        history: [
          { date: "1", event: "old", actor: "A" },
          { date: "2", event: "new", actor: "B" },
        ],
      })
    );
    expect(m.history.map((h) => h.event)).toEqual(["new", "old"]);
  });
});

describe("buildPanelModel — data governance", () => {
  const model = (r: DataGovernanceRequest) =>
    buildPanelModel(ticket({ source: "data-governance" }), "To do", { kind: "data-change", request: r }, t);

  it("awaiting review: endorse first, reject second, Escalate", () => {
    const m = model(request({}));
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([
      ["dgr-endorse", "primary"],
      ["dgr-reject", "secondary"],
    ]);
    expect(m.escalate).toBe(true);
  });

  it("endorsed: final approval", () => {
    const m = model(request({ status: "Endorsed — Awaiting 2nd Approval", approvalStep: 2 }));
    expect(m.actions[0].id).toBe("dgr-final");
  });

  it.each(["Approved", "Rejected"] as const)("%s: no actions, Chat only", (status) => {
    const m = model(request({ status }));
    expect(m.actions).toEqual([]);
    expect(m.escalate).toBe(false);
  });
});

describe("buildPanelModel — onboarding", () => {
  const all = STANDARD_DOCUMENT_TYPES.map((d, i) => doc({ id: `d${i}`, documentName: d.name, status: "pending-review" }));

  it("maps the stored statuses to the LYNK-117 states", () => {
    expect(onboardingStage(onbCase({ status: "Pending" }), [])).toBe("invite");
    expect(onboardingStage(onbCase({ status: "Opened" }), [])).toBe("invite");
    expect(onboardingStage(onbCase({ status: "Stale" }), [])).toBe("invite");
    expect(onboardingStage(onbCase({ status: "In Review" }), all)).toBe("review");
    expect(onboardingStage(onbCase({ status: "In Review" }), all.slice(1))).toBe("review-incomplete");
    expect(onboardingStage(onbCase({ status: "Changes Requested" }), all)).toBe("changes");
    expect(onboardingStage(onbCase({ status: "Contract Sent (Pending Signature)" }), all)).toBe("contract");
  });

  const model = (c: OnboardingCase, docs: SupplierDoc[] = [], supplier?: Supplier) =>
    buildPanelModel(ticket({ source: "onboarding" }), "To do", { kind: "onboarding", caseItem: c, supplier, docs }, t);

  it("stale invitation: send reminder, Escalate", () => {
    const m = model(onbCase({}));
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([["onb-remind", "primary"]]);
    expect(m.escalate).toBe(true);
    expect(m.fullReview).toBe(false);
  });

  it("application ready: accept is recommended, reject is separate; Chat only", () => {
    const m = model(onbCase({ status: "In Review" }), all, { id: "x" } as Supplier);
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([
      ["onb-accept", "primary"],
      ["onb-request-changes", "secondary"],
      ["onb-reject", "destructive"],
    ]);
    expect(m.escalate).toBe(false);
    expect(m.fullReview).toBe(true);
  });

  it("missing documents: counts them, no accept, Escalate", () => {
    const rejected = all.map((d, i) => (i === 0 ? { ...d, status: "rejected-resubmit" as const } : d)).slice(0, 4);
    const m = model(onbCase({ status: "In Review" }), rejected, { id: "x" } as Supplier);
    expect(m.alert?.title).toBe("1 missing, 1 rejected");
    expect(m.actions.map((a) => a.id)).toEqual(["onb-request-changes", "onb-reject"]);
    expect(m.escalate).toBe(true);
  });

  it("changes requested: ball with the prospect, reminder only, Chat only", () => {
    const m = model(onbCase({ status: "Changes Requested" }), all);
    expect(m.alert?.title).toBe("Ball is with the prospect");
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([["onb-remind", "secondary"]]);
    expect(m.escalate).toBe(false);
  });
});

describe("buildPanelModel — contracts", () => {
  const model = (c: Contract) =>
    buildPanelModel(ticket({ source: "contracts" }), "To do", { kind: "contract", contract: c }, t);

  it("renewal urgent: dates as phrases, renew, Escalate", () => {
    const m = model(contract({}));
    expect(m.facts.slice(0, 2).map((f) => f.value)).toEqual([
      "Ends in 8 days · 18 Jul 2026",
      "Was due 82 days ago · 19 Apr 2026",
    ]);
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([["contract-renew", "primary"]]);
    expect(m.objectStatus?.label).toBe("Renewal Urgent");
    expect(m.escalate).toBe(true);
  });

  it("expiring soon: review recommended, renew secondary", () => {
    const m = model(contract({ status: "Expiring Soon", timeLeftLabel: "74d left" }));
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([
      ["contract-review", "primary"],
      ["contract-renew", "secondary"],
    ]);
  });

  it("renewal in progress: waiting for signature, Chat only", () => {
    const m = model(contract({ status: "Renewal in Progress", timeLeftLabel: "Expired" }));
    expect(m.actions).toEqual([]);
    expect(m.escalate).toBe(false);
  });
});

describe("buildPanelModel — fallbacks", () => {
  it("not found: says so, keeps Escalate, shows no record", () => {
    const m = buildPanelModel(ticket({}), "To do", { kind: "not-found" }, t);
    expect(m.alert?.title).toBe("Linked record not found");
    expect(m.objectLabel).toBeUndefined();
    expect(m.actions).toEqual([]);
    expect(m.escalate).toBe(true);
  });

  it("a resolved ticket has nothing left to escalate", () => {
    const m = buildPanelModel(ticket({}), "Resolved", { kind: "document", doc: doc({}) }, t);
    expect(m.escalate).toBe(false);
  });
});
