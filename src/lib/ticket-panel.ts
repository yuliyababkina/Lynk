import type { AlertBannerType } from "@/components/yarowa/alert-banner";
import type {
  Contract,
  ContractStatus,
  DataGovernanceRequest,
  DocStatus,
  OnboardingCase,
  OnboardingStatus,
  Supplier,
  SupplierDoc,
  Ticket,
  TicketStatus,
} from "../types";
import type { TVars } from "./i18n";
import type { DocBadgeVariant } from "./document-status";
import { STANDARD_DOCUMENT_TYPES } from "./onboarding-documents";
import { contractDaysLeft, contractEndPhrase, duePhrase, expiryPhrase, renewalDueDays } from "./date-phrases";
import type { TicketTarget } from "./ticket-target";

type Translate = (source: string, vars?: TVars) => string;

/*
 * What the ticket panel shows for one ticket, per object type and status. The
 * panel itself (ticket-drawer.tsx) is a fixed skeleton; everything that varies
 * with the object — its status badge, the facts, the alert, which actions are
 * offered and whether Escalate belongs in the footer — is decided here, as plain
 * data, so each status rule from LYNK-117 can be read (and tested) in one place.
 *
 * Footer rule: Escalate only when the ball is with us and the item is open.
 * Waiting on the other party, or closed → Chat only.
 */

export type PanelActionId =
  | "doc-remind"
  | "doc-revoke"
  | "dgr-endorse"
  | "dgr-final"
  | "dgr-reject"
  | "onb-remind"
  | "onb-accept"
  | "onb-request-changes"
  | "onb-reject"
  | "contract-review"
  | "contract-renew"
  | "ticket-primary";

export interface PanelAction {
  id: PanelActionId;
  label: string;
  /** At most one "primary" per panel; "destructive" sits apart and asks to confirm. */
  emphasis: "primary" | "secondary" | "destructive";
}

export interface PanelFact {
  label: string;
  value: string;
  tone?: "danger";
}

export interface PanelEvent {
  date: string;
  event: string;
  actor?: string;
}

export interface PanelModel {
  /** "Document" / "Change request" / "Application" / "Contract"; absent with no record. */
  objectLabel?: string;
  objectName?: string;
  objectSub?: string;
  objectStatus?: { label: string; variant: DocBadgeVariant };
  facts: PanelFact[];
  alert?: { type: AlertBannerType; title: string; body?: string };
  actions: PanelAction[];
  /** Newest first. */
  history: PanelEvent[];
  escalate: boolean;
  /** The uploaded renewal's review card (compliance, pending review). */
  renewalReview?: boolean;
  /** An onboarding application exists: its body and "Open full review" show. */
  fullReview?: boolean;
}

/* ── Status badges, shared with the workspaces ────────────────────────── */

export const COMPLIANCE_STATUS_META: Record<DocStatus, { label: string; variant: DocBadgeVariant }> = {
  valid: { label: "Valid", variant: "success" },
  "warning-60": { label: "60-Day Warning", variant: "warning" },
  "warning-30": { label: "30-Day Auto-Notify", variant: "orange" },
  "pending-review": { label: "Pending Review", variant: "info" },
  "rejected-resubmit": { label: "Rejected — Resubmit", variant: "danger" },
  blocked: { label: "Blocked", variant: "neutral" },
};

export const CONTRACT_STATUS_VARIANT: Record<ContractStatus, DocBadgeVariant> = {
  Active: "success",
  "Expiring Soon": "warning",
  "Renewal Urgent": "danger",
  "Renewal in Progress": "info",
  "Opted Out": "neutral",
};

export const DATA_CHANGE_STATUS_VARIANT: Record<DataGovernanceRequest["status"], DocBadgeVariant> = {
  "Awaiting Review": "warning",
  "Endorsed — Awaiting 2nd Approval": "info",
  Approved: "success",
  Rejected: "danger",
};

export const ONBOARDING_STATUS_VARIANT: Record<OnboardingStatus, DocBadgeVariant> = {
  Draft: "neutral",
  Stale: "danger",
  Pending: "info",
  Opened: "info",
  "In Review": "warning",
  "Changes Requested": "info",
  "Contract Sent (Pending Signature)": "info",
  Accepted: "success",
  Rejected: "danger",
};

/* ── Compliance ───────────────────────────────────────────────────────── */

/** The reason a reviewer gave, from the "Rejected — <reason>" history entry. */
export function rejectionReason(doc: SupplierDoc): string | undefined {
  const entry = [...doc.history].reverse().find((h) => h.event.startsWith("Rejected — "));
  return entry?.event.slice("Rejected — ".length);
}

/** When the supplier was blocked: the newest "blocked" history entry. */
export function blockedSince(doc: SupplierDoc): string | undefined {
  return [...doc.history].reverse().find((h) => h.type === "blocked")?.date;
}

function expiryValue(doc: SupplierDoc, t: Translate): string {
  if (doc.doesNotExpire) return t("Does not expire");
  if (!doc.expiryDate) return "—";
  return expiryPhrase(doc.daysUntilExpiry, doc.expiryDate, t);
}

/**
 * The date facts for one document. The Compliance drawer shows the same list,
 * so a document reads the same wherever it is opened.
 */
export function documentFacts(doc: SupplierDoc, t: Translate): PanelFact[] {
  const expires = expiryValue(doc, t);
  switch (doc.status) {
    case "blocked": {
      const since = blockedSince(doc);
      return [
        { label: t("Document expired"), value: expires, tone: "danger" },
        ...(since ? [{ label: t("Supplier blocked since"), value: since }] : []),
      ];
    }
    case "pending-review":
      return [
        { label: t("Current document expires"), value: expires },
        ...(doc.renewal
          ? [
              {
                label: t("Renewal uploaded"),
                value: t("{date} · {who}", { date: doc.renewal.uploadedAt, who: doc.renewal.uploadedBy }),
              },
            ]
          : []),
      ];
    case "rejected-resubmit":
      return [{ label: t("Current document expires"), value: expires }];
    case "warning-30":
      return [
        { label: t("Document expires"), value: expires },
        ...(doc.autoNotified ? [{ label: t("Supplier auto-notified"), value: doc.autoNotified }] : []),
      ];
    default:
      return [{ label: t("Document expires"), value: expires }];
  }
}

function documentModel(doc: SupplierDoc, t: Translate): PanelModel {
  const meta = COMPLIANCE_STATUS_META[doc.status];
  const remind: PanelAction = { id: "doc-remind", label: t("Send manual reminder"), emphasis: "primary" };
  const base = {
    objectLabel: t("Document"),
    objectName: t(doc.documentName),
    objectSub: [t(doc.documentCategory), doc.issuingInstitution].filter(Boolean).join(" · "),
    objectStatus: { label: t(meta.label), variant: meta.variant },
    facts: documentFacts(doc, t),
    history: [...doc.history].reverse().map((h) => ({ date: h.date, event: t(h.event), actor: h.actor })),
  };

  switch (doc.status) {
    case "warning-60":
      return {
        ...base,
        alert: {
          type: "warning",
          title: t("60-day window — action recommended"),
          body: t("Send a manual reminder now to give the supplier time to prepare their renewal."),
        },
        actions: [remind],
        escalate: true,
      };
    case "warning-30":
      return {
        ...base,
        alert: {
          type: "warning",
          title: t("Supplier was auto-notified"),
          body: doc.autoNotified
            ? t("The 30-day notification reached the supplier portal on {date}. A manual reminder can prompt a faster response.", {
                date: doc.autoNotified,
              })
            : t("The 30-day auto-notification has been sent. A manual reminder can prompt a faster response."),
        },
        actions: [remind],
        escalate: true,
      };
    case "pending-review":
      return {
        ...base,
        alert: {
          type: "info",
          title: t("Renewal awaiting your review"),
          body: t("Accept it to replace the current document, or reject it to ask the supplier for a new upload."),
        },
        actions: [],
        renewalReview: Boolean(doc.renewal),
        escalate: false,
      };
    case "rejected-resubmit": {
      const reason = rejectionReason(doc);
      return {
        ...base,
        alert: {
          type: "error",
          title: t("Resubmission required"),
          body: reason
            ? t("Rejected in review: {reason}. Ask the supplier to correct and re-submit the document.", { reason })
            : t("The last upload was rejected in review. Ask the supplier to correct and re-submit the document."),
        },
        actions: [remind, { id: "doc-revoke", label: t("Revoke supplier access"), emphasis: "destructive" }],
        escalate: true,
      };
    }
    case "blocked":
      return {
        ...base,
        alert: {
          type: "neutral",
          title: t("Supplier blocked from work orders"),
          body: t("The document expired without an accepted renewal. New work orders resume once a renewal is uploaded and accepted."),
        },
        actions: [remind],
        escalate: true,
      };
    default:
      // No tickets are raised on valid documents; one that still points at one
      // is already settled.
      return {
        ...base,
        alert: { type: "success", title: t("No action needed"), body: t("This document is valid.") },
        actions: [],
        escalate: false,
      };
  }
}

/* ── Contracts ────────────────────────────────────────────────────────── */

export function contractFacts(c: Contract, t: Translate): PanelFact[] {
  const daysLeft = contractDaysLeft(c.timeLeftLabel);
  const renewalDays = renewalDueDays(c.timeLeftLabel, c.renewalBy, c.endDate);
  const facts: PanelFact[] = [
    {
      label: t("Contract ends"),
      value: contractEndPhrase(daysLeft, c.endDate, t),
      tone: daysLeft === null || daysLeft <= 30 ? "danger" : undefined,
    },
  ];
  if (c.status === "Renewal Urgent" || c.status === "Expiring Soon") {
    facts.push({
      label: t("Renewal decision due"),
      value: duePhrase(renewalDays, c.renewalBy, t),
      tone: renewalDays !== null && renewalDays < 0 ? "danger" : undefined,
    });
  }
  facts.push(
    { label: t("Annual value"), value: t("€{value} per year", { value: c.annualValue.toLocaleString() }) },
    { label: t("Notice period"), value: c.noticePeriod }
  );
  return facts;
}

function contractModel(c: Contract, t: Translate): PanelModel {
  const renewalDays = renewalDueDays(c.timeLeftLabel, c.renewalBy, c.endDate);
  const base = {
    objectLabel: t("Contract"),
    objectName: c.ref,
    objectSub: t(c.type),
    objectStatus: { label: t(c.status), variant: CONTRACT_STATUS_VARIANT[c.status] },
    facts: contractFacts(c, t),
    history: [],
  };
  const renew: PanelAction = { id: "contract-renew", label: t("Renew contract"), emphasis: "primary" };

  switch (c.status) {
    case "Renewal Urgent":
      return {
        ...base,
        alert: {
          type: "error",
          title: renewalDays !== null && renewalDays < 0 ? t("Renewal decision overdue") : t("Renewal decision due"),
          body: t("Renew the contract before it ends on {date}, or it lapses without a decision.", { date: c.endDate }),
        },
        actions: [renew],
        escalate: true,
      };
    case "Expiring Soon":
      return {
        ...base,
        alert: {
          type: "warning",
          title: t("Renewal decision coming up"),
          body: t("Review the contract and decide on renewal by {date}.", { date: c.renewalBy }),
        },
        actions: [
          { id: "contract-review", label: t("Review contract"), emphasis: "primary" },
          { ...renew, emphasis: "secondary" },
        ],
        escalate: true,
      };
    case "Renewal in Progress":
      return {
        ...base,
        alert: {
          type: "neutral",
          title: t("New contract sent, waiting for signature"),
          body: t("The supplier has the renewal contract. Nothing to do until they sign."),
        },
        actions: [],
        escalate: false,
      };
    case "Opted Out":
      return {
        ...base,
        alert: { type: "neutral", title: t("Opted out"), body: t("This contract was not renewed.") },
        actions: [],
        escalate: false,
      };
    default:
      return {
        ...base,
        alert: { type: "success", title: t("No action needed"), body: t("This contract is active.") },
        actions: [],
        escalate: false,
      };
  }
}

/* ── Data governance ──────────────────────────────────────────────────── */

function dataChangeModel(r: DataGovernanceRequest, t: Translate): PanelModel {
  const base = {
    objectLabel: t("Change request"),
    objectName: t("{category} change", { category: t(r.category) }),
    objectSub: t("Requested by {who} · {when}", { who: r.requestedBy, when: r.requestedAt }),
    objectStatus: { label: t(r.status), variant: DATA_CHANGE_STATUS_VARIANT[r.status] },
    facts: [],
    history: [{ date: r.requestedAt, event: t("Change requested"), actor: r.requestedBy }],
  };
  const reject: PanelAction = { id: "dgr-reject", label: t("Reject change"), emphasis: "secondary" };

  switch (r.status) {
    case "Awaiting Review":
      return {
        ...base,
        alert:
          r.risk === "Critical"
            ? {
                type: "warning",
                title: t("Verify before endorsing"),
                body: t("IBAN and banking changes carry the highest fraud risk. Review carefully and verify with the supplier directly before endorsing."),
              }
            : { type: "info", title: t("Awaiting first review") },
        actions: [{ id: "dgr-endorse", label: t("Endorse — first review"), emphasis: "primary" }, reject],
        escalate: true,
      };
    case "Endorsed — Awaiting 2nd Approval":
      return {
        ...base,
        alert: {
          type: "info",
          title: t("Awaiting final approval"),
          body: t("The first review is done. A second approver gives final approval before the change takes effect."),
        },
        actions: [{ id: "dgr-final", label: t("Final approval"), emphasis: "primary" }, reject],
        escalate: true,
      };
    case "Approved":
      return {
        ...base,
        alert: { type: "success", title: t("Change applied"), body: t("Both approvals are in. The new values are live.") },
        actions: [],
        escalate: false,
      };
    default:
      return {
        ...base,
        alert: { type: "error", title: t("Change rejected"), body: t("This change was rejected and not applied.") },
        actions: [],
        escalate: false,
      };
  }
}

/* ── Onboarding ───────────────────────────────────────────────────────── */

/**
 * LYNK-117 onboarding states, mapped from the stored OnboardingStatus:
 *  - Pending / Opened / Stale          → "invite"   (no application yet)
 *  - In Review, checklist complete     → "review"
 *  - In Review, missing or rejected    → "review-incomplete"
 *  - Changes Requested                 → "changes"  (waiting on the prospect)
 *  - Contract Sent (Pending Signature) → "contract" (waiting on the prospect)
 *  - Accepted / Rejected / Draft       → closed
 */
export type OnboardingStage =
  | "invite"
  | "review"
  | "review-incomplete"
  | "changes"
  | "contract"
  | "accepted"
  | "rejected"
  | "draft";

export function documentGaps(docs: SupplierDoc[]): { missing: number; rejected: number } {
  const missing = STANDARD_DOCUMENT_TYPES.filter((type) => !docs.some((d) => d.documentName === type.name)).length;
  const rejected = docs.filter((d) => d.status === "rejected-resubmit").length;
  return { missing, rejected };
}

export function onboardingStage(c: OnboardingCase, docs: SupplierDoc[]): OnboardingStage {
  switch (c.status) {
    case "Pending":
    case "Opened":
    case "Stale":
      return "invite";
    case "In Review": {
      const { missing, rejected } = documentGaps(docs);
      return missing + rejected > 0 ? "review-incomplete" : "review";
    }
    case "Changes Requested":
      return "changes";
    case "Contract Sent (Pending Signature)":
      return "contract";
    case "Accepted":
      return "accepted";
    case "Rejected":
      return "rejected";
    default:
      return "draft";
  }
}

function onboardingModel(c: OnboardingCase, supplier: Supplier | undefined, docs: SupplierDoc[], t: Translate): PanelModel {
  const stage = onboardingStage(c, docs);
  const base = {
    objectLabel: t("Application"),
    objectName: c.companyName,
    objectSub: [c.contactName, c.email].filter(Boolean).join(" · "),
    objectStatus: { label: t(c.status), variant: ONBOARDING_STATUS_VARIANT[c.status] },
    facts: [] as PanelFact[],
    history: [] as PanelEvent[],
    // Before the prospect applies there is nothing to review, even when a
    // profile shell already exists.
    fullReview: Boolean(supplier) && stage !== "invite" && stage !== "draft",
  };
  const remind: PanelAction = { id: "onb-remind", label: t("Send reminder"), emphasis: "primary" };
  const requestChanges: PanelAction = { id: "onb-request-changes", label: t("Request changes"), emphasis: "secondary" };
  const reject: PanelAction = { id: "onb-reject", label: t("Reject application"), emphasis: "destructive" };
  const quoted = c.reviewNote ? t("“{note}”", { note: c.reviewNote }) : undefined;

  switch (stage) {
    case "invite": {
      const invitation = c.status === "Stale" ? "Stale" : c.status === "Opened" ? "Opened" : "Sent";
      const days = t("{n} days", { n: c.daysNoResponse });
      return {
        ...base,
        facts: [
          { label: t("Invitation"), value: t(invitation), tone: c.status === "Stale" ? "danger" : undefined },
          { label: t("No response for"), value: days },
        ],
        alert:
          c.status === "Stale"
            ? {
                type: "warning",
                title: t("Invitation stale"),
                body: t("No response in {n} days. Send a reminder, or check the contact details are right.", {
                  n: c.daysNoResponse,
                }),
              }
            : c.status === "Opened"
              ? {
                  type: "info",
                  title: t("Opened, not submitted"),
                  body: t("The prospect opened the invitation but hasn't submitted an application yet."),
                }
              : {
                  type: "info",
                  title: t("No response yet"),
                  body: t("The invitation hasn't been opened yet."),
                },
        actions: [remind],
        escalate: true,
      };
    }
    case "review":
      return {
        ...base,
        alert: {
          type: "info",
          title: t("Application ready for review"),
          body: t("All documents are in. Open the full review to check each section, or decide here."),
        },
        actions: [{ id: "onb-accept", label: t("Accept application"), emphasis: "primary" }, requestChanges, reject],
        escalate: false,
      };
    case "review-incomplete": {
      const { missing, rejected } = documentGaps(docs);
      return {
        ...base,
        alert: {
          type: "error",
          title: t("{missing} missing, {rejected} rejected", { missing, rejected }),
          body: t("Ask the prospect for the missing or corrected documents before accepting."),
        },
        actions: [requestChanges, reject],
        escalate: true,
      };
    }
    case "changes":
      return {
        ...base,
        alert: {
          type: "neutral",
          title: t("Ball is with the prospect"),
          body: quoted
            ? t("Changes requested: {note}", { note: quoted })
            : t("Changes requested — awaiting the supplier's resubmission."),
        },
        actions: [{ ...remind, emphasis: "secondary" }],
        escalate: false,
      };
    case "contract":
      return {
        ...base,
        alert: {
          type: "neutral",
          title: t("Waiting for signature"),
          body: t("The contract and price agreements were sent. Nothing to do until the prospect signs."),
        },
        actions: [],
        escalate: false,
      };
    case "accepted":
      return {
        ...base,
        alert: {
          type: "success",
          title: t("Application accepted"),
          body: t("Accepted — supplier profile is now active in Lynk. A confirmation email was sent."),
        },
        actions: [],
        escalate: false,
      };
    case "rejected":
      return {
        ...base,
        alert: { type: "error", title: t("Application rejected."), body: quoted },
        actions: [],
        escalate: false,
      };
    default:
      return {
        ...base,
        alert: {
          type: "neutral",
          title: t("Invitation revoked"),
          body: t("There is no live invitation link. Send a new invitation from Onboarding."),
        },
        actions: [],
        escalate: false,
      };
  }
}

/* ── Entry point ──────────────────────────────────────────────────────── */

export function buildPanelModel(
  ticket: Ticket,
  ticketStatus: TicketStatus,
  target: TicketTarget,
  t: Translate
): PanelModel {
  let model: PanelModel;
  switch (target.kind) {
    case "document":
      model = documentModel(target.doc, t);
      break;
    case "contract":
      model = contractModel(target.contract, t);
      break;
    case "data-change":
      model = dataChangeModel(target.request, t);
      break;
    case "onboarding":
      model = onboardingModel(target.caseItem, target.supplier, target.docs, t);
      break;
    case "no-object":
      // Profile tasks have no single record by design; they keep the action
      // they always had.
      model = {
        facts: [],
        history: [],
        alert: {
          type: "neutral",
          title: t("No linked record"),
          body: t("This task is about {entity}'s profile as a whole. Open the supplier to work on it.", {
            entity: ticket.entityName,
          }),
        },
        actions: [{ id: "ticket-primary", label: t(ticket.primaryAction), emphasis: "primary" }],
        escalate: true,
      };
      break;
    default:
      model = {
        facts: [],
        history: [],
        alert: {
          type: "warning",
          title: t("Linked record not found"),
          body: t("The record this task points to can't be found. Only the task's own details are shown."),
        },
        actions: [],
        escalate: true,
      };
  }
  // A resolved task is closed: nothing left to escalate.
  return ticketStatus === "Resolved" ? { ...model, escalate: false } : model;
}
