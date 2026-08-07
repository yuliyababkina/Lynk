import type { OnboardingCase, Supplier, SupplierDoc } from "../types";

/*
 * Derives the onboarding pipeline's per-stage columns from the data we actually
 * hold: the case status, the linked supplier profile, and the supplier's
 * documents. Each cell answers "where is this stage?" rather than repeating the
 * single overall status.
 *
 * Known limits of the current data model, called out so the mapping isn't
 * mistaken for something richer than it is:
 *  - onboarding_cases has no updated_at column, so "last change" falls back to
 *    the newest document-history entry and is "—" when there are no documents.
 *  - Per-document signatures aren't persisted, so Contract and Price Agreements
 *    necessarily move together: both are Sent when the contract goes out and
 *    Signed once the case is accepted.
 */

/**
 * "done" renders as a bare green checkmark rather than a badge: once a stage is
 * finished it is no longer a status the PM has to read, so it should recede.
 */
export type CellTone = "muted" | "info" | "warning" | "success" | "danger" | "done";
export interface Cell {
  label: string;
  tone: CellTone;
}

const EMPTY: Cell = { label: "—", tone: "muted" };

/** Statuses that can only be reached after the prospect opened their link. */
const PAST_INVITE: OnboardingCase["status"][] = [
  "In Review",
  "Changes Requested",
  "Contract Sent (Pending Signature)",
  "Accepted",
  "Rejected",
];

/**
 * The invitation's job is done the moment the prospect starts filling the
 * application in — from then on the interesting state lives in the later
 * columns, so this one collapses to a checkmark. `started` is true once a
 * supplier profile or any uploaded document exists for the case.
 */
export function invitationCell(c: OnboardingCase, started = false): Cell {
  if (c.status === "Draft") return EMPTY; // revoked — no live invitation
  if (c.status === "Stale") return { label: "Stale", tone: "danger" };
  if (started || PAST_INVITE.includes(c.status)) return { label: "Invitation accepted", tone: "done" };
  if (c.status === "Opened") return { label: "Opened", tone: "info" };
  return { label: "Sent", tone: "info" };
}

export function companyInfoCell(c: OnboardingCase, supplier?: Supplier): Cell {
  if (!supplier) return EMPTY;
  if (c.status === "Accepted" || c.status === "Contract Sent (Pending Signature)")
    return { label: "Approved", tone: "success" };
  if (c.status === "In Review" || c.status === "Changes Requested")
    return { label: "Pending review", tone: "warning" };
  return { label: "Added", tone: "info" };
}

export function documentsCell(docs: SupplierDoc[]): Cell {
  if (docs.length === 0) return EMPTY;
  if (docs.some((d) => d.status === "pending-review")) return { label: "Pending review", tone: "warning" };
  // Every document reviewed and none awaiting attention.
  if (docs.every((d) => d.status === "valid" || d.status === "warning-60" || d.status === "warning-30"))
    return { label: "Approved", tone: "success" };
  return { label: "Uploaded", tone: "info" };
}

/** Contract and price agreements share a state — see the note at the top. */
export function signableCell(c: OnboardingCase): Cell {
  if (c.status === "Accepted") return { label: "Signed", tone: "success" };
  if (c.status === "Contract Sent (Pending Signature)") return { label: "Sent", tone: "info" };
  return EMPTY;
}

/**
 * Newest document-history entry, as a date. Stands in for a real case
 * updated_at, which the table would use if the column existed.
 */
export function lastChange(docs: SupplierDoc[]): Date | null {
  let newest: number | null = null;
  for (const d of docs) {
    for (const h of d.history ?? []) {
      const ms = Date.parse(h.date);
      if (!Number.isNaN(ms) && (newest === null || ms > newest)) newest = ms;
    }
  }
  return newest === null ? null : new Date(newest);
}

/** Locale-aware short date, so the column follows the language toggle. */
export function formatLastChange(d: Date | null, lang: string): string {
  if (!d) return "—";
  return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
