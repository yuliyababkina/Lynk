import { describe, expect, it } from "vitest";
import type { Contract, DataGovernanceRequest, OnboardingCase, Supplier, SupplierDoc, Ticket } from "../types";
import type { TVars } from "./i18n";
import { contractEndPhrase, duePhrase, expiryPhrase, parseDisplayDate, renewalDueDays } from "./date-phrases";
import { findLinkedObject, resolveTicketObject, resolveTicketTarget, type TicketTargetData } from "./ticket-target";
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

describe("resolveTicketObject — one resolver for every source", () => {
  const d = doc({});
  const c = contract({});
  const r = request({});
  const o = onbCase({});
  const all = data({ docs: [d], contracts: [c], dataGovernanceRequests: [r], onboardingCases: [o] });

  it.each([
    ["compliance-monitoring", "Müller Logistik KG", "doc-004", { kind: "document", doc: d }],
    ["contracts", "Thiel Metallbau GmbH", "c7", { kind: "contract", contract: c }],
    ["data-governance", "BauParts GmbH", "dgr-1", { kind: "data-change", request: r }],
    ["onboarding", "Bauer Sanitär GmbH", "onb-1", { kind: "onboarding", caseItem: o, supplier: undefined, docs: [] }],
  ] as const)("%s: follows the target id", (source, entityName, targetId, expected) => {
    expect(resolveTicketObject(ticket({ source, entityName, targetId }), all)).toEqual(expected);
  });

  it.each([
    ["compliance-monitoring", "Müller Logistik KG"],
    ["contracts", "Thiel Metallbau GmbH"],
    ["data-governance", "BauParts GmbH"],
    ["onboarding", "Bauer Sanitär GmbH"],
  ] as const)("%s: a target id with no record is null, never a guess", (source, entityName) => {
    // A stale id: nothing by that id, and the title matches nothing either.
    const tk = ticket({ source, entityName, targetId: "gone", title: "Something else — 3 days" });
    expect(resolveTicketObject(tk, data())).toBeNull();
  });

  it.each([
    ["compliance-monitoring", "doc-004"],
    ["contracts", "c7"],
    ["data-governance", "dgr-1"],
    ["onboarding", "onb-1"],
  ] as const)("%s: an id pointing at another company's record is null", (source, targetId) => {
    expect(resolveTicketObject(ticket({ source, entityName: "Someone Else GmbH", targetId }), all)).toBeNull();
  });

  it("data governance without an id: the company's one open request", () => {
    const tk = ticket({ source: "data-governance", entityName: "BauParts GmbH", targetId: undefined });
    expect(resolveTicketObject(tk, all)).toEqual({ kind: "data-change", request: r });
    const closed = data({ dataGovernanceRequests: [request({ status: "Approved" })] });
    expect(resolveTicketObject(tk, closed)).toBeNull();
  });

  it("onboarding without an id: the company's only case", () => {
    const tk = ticket({ source: "onboarding", entityName: "Bauer Sanitär GmbH", targetId: undefined });
    expect(resolveTicketObject(tk, all)?.kind).toBe("onboarding");
  });

  it("two equally good matches are not guessed between", () => {
    const twin = doc({ id: "doc-004b" });
    expect(resolveTicketObject(ticket({ targetId: undefined }), data({ docs: [d, twin] }))).toBeNull();
  });

  it.each(["data-quality", "prospect"] as const)("%s: no record by design", (source) => {
    expect(resolveTicketObject(ticket({ source, targetId: "doc-004" }), all)).toBeNull();
    expect(resolveTicketTarget(ticket({ source }), all).kind).toBe("no-object");
  });

  it("the panel calls a missing record not-found", () => {
    expect(resolveTicketTarget(ticket({ targetId: "gone", title: "Nope — 1 day" }), data()).kind).toBe("not-found");
  });
});

describe("findLinkedObject — the lookup App.navigate uses", () => {
  const all = data({ docs: [doc({})], contracts: [contract({})] });

  it("finds a record by kind and id", () => {
    expect(findLinkedObject("document", "doc-004", all)?.kind).toBe("document");
    expect(findLinkedObject("contract", "c7", all)?.kind).toBe("contract");
  });

  it("is null for an unknown id, a missing id, or the wrong kind", () => {
    expect(findLinkedObject("document", "doc-999", all)).toBeNull();
    expect(findLinkedObject("document", undefined, all)).toBeNull();
    expect(findLinkedObject("contract", "doc-004", all)).toBeNull();
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
        renewal: {
          fileName: "f.pdf",
          fileSize: "1 MB",
          uploadedAt: "28 Jun 2026, 08:30",
          uploadedBy: "Anna",
          validUntil: "12 Aug 2028",
        },
      })
    );
    // Both dates: what counts today, and what the upload would replace it with.
    expect(m.facts.map((f) => [f.label, f.value])).toEqual([
      ["Current document expires", "Expires in 49 days · 6 Aug 2026"],
      ["Renewal valid until", "12 Aug 2028"],
      ["Renewal uploaded", "28 Jun 2026, 08:30 · Anna"],
    ]);
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

  it("blocked with a renewal uploaded: the review card shows", () => {
    const m = model(
      doc({
        status: "blocked",
        renewal: { fileName: "f.pdf", fileSize: "1 MB", uploadedAt: "13 Jun 2026, 09:44", uploadedBy: "Petra" },
      })
    );
    expect(m.renewalReview).toBe(true);
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
  const users: Record<string, string> = { "u-me": "Sabine Müller", "u-jonas": "Jonas Becker" };
  const model = (r: DataGovernanceRequest) =>
    buildPanelModel(ticket({ source: "data-governance" }), "To do", { kind: "data-change", request: r }, t, {
      currentUserId: "u-me",
      userName: (id) => users[id],
    });

  it("awaiting review: endorse first, reject second, Escalate", () => {
    const m = model(request({}));
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([
      ["dgr-endorse", "primary"],
      ["dgr-reject", "secondary"],
    ]);
    expect(m.escalate).toBe(true);
  });

  it("endorsed by a colleague: final approval is yours to give", () => {
    const m = model(
      request({ status: "Endorsed — Awaiting 2nd Approval", approvalStep: 2, endorsedBy: "u-jonas", endorsedAt: "23 Jun 2026" })
    );
    expect(m.actions[0]).toMatchObject({ id: "dgr-final", emphasis: "primary" });
    expect(m.actions[0].disabled).toBeUndefined();
    expect(m.facts).toEqual([{ label: "First review", value: "Jonas Becker · 23 Jun 2026" }]);
    expect(m.history[0]).toEqual({ date: "23 Jun 2026", event: "Endorsed — first review", actor: "Jonas Becker" });
  });

  it("endorsed by you: final approval disabled, with the reason", () => {
    const m = model(request({ status: "Endorsed — Awaiting 2nd Approval", approvalStep: 2, endorsedBy: "u-me" }));
    expect(m.actions[0]).toMatchObject({
      id: "dgr-final",
      disabled: true,
      note: "You did the first review. Another approver must give final approval.",
    });
    expect(m.actions[1].id).toBe("dgr-reject");
  });

  it("rejected: the reason is in the alert", () => {
    const m = model(request({ status: "Rejected", rejectionReason: "Account holder does not match." }));
    expect(m.alert).toMatchObject({
      type: "error",
      body: "Rejected: Account holder does not match. The change was not applied.",
    });
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
    buildPanelModel(ticket({ source: "onboarding" }), "To do", { kind: "onboarding", caseItem: c, supplier, docs }, t, {
      today: "25 Nov 2026",
    });

  it("invitation never reminded: says so", () => {
    const m = model(onbCase({ status: "Pending", daysNoResponse: 0, invitedAt: "25 Nov 2026" }));
    expect(m.facts.map((f) => f.value)).toEqual(["Today · 25 Nov 2026", "None sent yet"]);
  });

  it("stale invitation: send reminder, change email, Escalate", () => {
    const m = model(onbCase({ invitedAt: "25 Oct 2026", lastReminderAt: "11 Nov 2026" }));
    expect(m.facts.map((f) => [f.label, f.value])).toEqual([
      ["Invited", "31 days ago · 25 Oct 2026"],
      ["Last reminder", "14 days ago · 11 Nov 2026"],
    ]);
    expect(m.actions.map((a) => [a.id, a.emphasis])).toEqual([
      ["onb-remind", "primary"],
      ["onb-change-email", "secondary"],
    ]);
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

  it("history: invitation and last reminder, newest first", () => {
    const m = model(onbCase({ invitedAt: "25 Oct 2026", lastReminderAt: "11 Nov 2026" }));
    expect(m.history).toEqual([
      { date: "11 Nov 2026", event: "Reminder sent" },
      { date: "25 Oct 2026", event: "Invitation sent" },
    ]);
  });

  it("history: no stored dates, no invented events", () => {
    const m = model(onbCase({ status: "Rejected", reviewNote: "Insurance expired." }), all);
    expect(m.history).toEqual([]);
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

  it("expiring soon, decision date passed: the alert says overdue, like the fact", () => {
    const m = model(contract({ status: "Expiring Soon", timeLeftLabel: "74d left", endDate: "31 Aug 2026", renewalBy: "31 May 2026" }));
    expect(m.facts[1].value).toBe("Was due 18 days ago · 31 May 2026");
    expect(m.alert?.type).toBe("error");
    expect(m.alert?.title).toBe("Renewal decision overdue");
    expect(m.actions.map((a) => a.id)).toEqual(["contract-review", "contract-renew"]);
  });

  it("expiring soon, decision date ahead: still coming up", () => {
    const m = model(contract({ status: "Expiring Soon", timeLeftLabel: "180d left", endDate: "31 Dec 2026", renewalBy: "30 Sep 2026" }));
    expect(m.alert?.title).toBe("Renewal decision coming up");
  });

  it("renewal in progress: says when the new contract went out, Chat only", () => {
    const m = model(contract({ status: "Renewal in Progress", timeLeftLabel: "Expired", renewalSentAt: "20 Nov 2026" }));
    expect(m.facts[0]).toEqual({ label: "New contract sent", value: "20 Nov 2026" });
    expect(m.alert?.title).toBe("New contract sent 20 Nov 2026, waiting for signature");
    expect(m.actions).toEqual([]);
    expect(m.escalate).toBe(false);
    expect(m.history).toEqual([{ date: "20 Nov 2026", event: "Renewal contract sent for signature" }]);
  });

  it("history: empty without a stored renewal date", () => {
    expect(model(contract({})).history).toEqual([]);
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
