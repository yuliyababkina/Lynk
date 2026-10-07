import { describe, expect, it } from "vitest";
import { documentsCell, invitationCell, companyInfoCell } from "./onboarding-columns";
import { STANDARD_DOCUMENT_TYPES } from "./onboarding-documents";
import type { OnboardingCase, Supplier, SupplierDoc } from "../types";

/*
 * The onboarding table's stage columns. Each cell answers one question — whose
 * move is it, and how far along — so the Procurement Manager can read a row
 * without opening it. Yellow means their move, blue means the prospect's; these
 * tests pin the state behind that colour.
 */

const STD = STANDARD_DOCUMENT_TYPES.map((t) => t.name);
const doc = (documentName: string, status: SupplierDoc["status"]) =>
  ({ documentName, status }) as SupplierDoc;
const onb = (status: OnboardingCase["status"]) => ({ status }) as OnboardingCase;
const supplier = {} as Supplier;

describe("documentsCell", () => {
  it("shows nothing before the first upload", () => {
    expect(documentsCell([])).toEqual({ label: "—", tone: "muted" });
  });

  it("counts what the manager owes a decision on", () => {
    const cell = documentsCell(STD.map((n) => doc(n, "pending-review")));
    expect(cell).toMatchObject({ label: "Pending review {n}/{total}", tone: "warning" });
    expect(cell.vars).toEqual({ n: 5, total: 5 });
  });

  it("puts a part-reviewed set back on the prospect", () => {
    const cell = documentsCell([
      doc(STD[0], "valid"),
      doc(STD[1], "valid"),
      doc(STD[2], "warning-60"),
      doc(STD[3], "rejected-resubmit"),
      doc(STD[4], "rejected-resubmit"),
    ]);
    expect(cell).toMatchObject({ label: "Pending update {n}/{total}", tone: "info" });
    expect(cell.vars).toEqual({ n: 2, total: 5 });
  });

  it("goes back to the manager once the prospect resubmits", () => {
    const cell = documentsCell([
      doc(STD[0], "valid"),
      doc(STD[1], "valid"),
      doc(STD[2], "warning-60"),
      doc(STD[3], "pending-review"),
      doc(STD[4], "pending-review"),
    ]);
    expect(cell).toMatchObject({ label: "Pending review {n}/{total}", tone: "warning" });
    expect(cell.vars).toEqual({ n: 2, total: 5 });
  });

  it("only turns green when the whole checklist is through", () => {
    const cell = documentsCell(STD.map((n) => doc(n, "valid")));
    expect(cell).toMatchObject({ label: "Approved {n}/{total}", tone: "success" });
    expect(cell.vars).toEqual({ n: 5, total: 5 });
  });

  it("counts an expiring document as approved — it was reviewed and accepted", () => {
    const cell = documentsCell([
      ...STD.slice(0, 4).map((n) => doc(n, "valid")),
      doc(STD[4], "warning-30"),
    ]);
    expect(cell.tone).toBe("success");
  });

  it("escalates to red when something is blocked outright", () => {
    const cell = documentsCell([...STD.slice(0, 4).map((n) => doc(n, "valid")), doc(STD[4], "blocked")]);
    expect(cell).toMatchObject({ label: "Pending update {n}/{total}", tone: "danger" });
    expect(cell.vars).toEqual({ n: 1, total: 5 });
  });

  it("counts the documents never uploaded, not just the ones on file", () => {
    // One of five uploaded: four are still owed, which a bare "Approved" hid.
    const cell = documentsCell([doc(STD[0], "valid")]);
    expect(cell.vars).toEqual({ n: 4, total: 5 });
  });

  it("widens the total for extra files uploaded on top of the checklist", () => {
    const cell = documentsCell([...STD.map((n) => doc(n, "valid")), doc("Environmental Permit", "valid")]);
    expect(cell.vars).toEqual({ n: 6, total: 6 });
  });
});

describe("invitationCell", () => {
  it("collapses to a checkmark once the prospect starts filling things in", () => {
    expect(invitationCell(onb("Opened"), true)).toMatchObject({ tone: "done" });
  });

  it("collapses once the application is submitted, even with nothing uploaded", () => {
    expect(invitationCell(onb("In Review"), false)).toMatchObject({ tone: "done" });
  });

  it("still flags a stale invitation ahead of everything else", () => {
    // Someone who started and then went quiet needs chasing; the checkmark
    // would hide the only signal that says so.
    expect(invitationCell(onb("Stale"), true)).toMatchObject({ label: "Stale", tone: "danger" });
  });

  it("separates sent from opened while nothing has happened yet", () => {
    expect(invitationCell(onb("Pending"), false)).toMatchObject({ label: "Sent" });
    expect(invitationCell(onb("Opened"), false)).toMatchObject({ label: "Opened" });
  });

  it("empties out for a revoked invitation", () => {
    expect(invitationCell(onb("Draft"), false)).toMatchObject({ tone: "muted" });
  });
});

describe("companyInfoCell", () => {
  it("stays empty until a profile exists", () => {
    expect(companyInfoCell(onb("Opened"), undefined)).toMatchObject({ tone: "muted" });
  });

  it("waits on the manager while the application is in review", () => {
    expect(companyInfoCell(onb("In Review"), supplier)).toMatchObject({
      label: "Pending review",
      tone: "warning",
    });
  });

  it("waits on the prospect after changes were requested", () => {
    expect(companyInfoCell(onb("Changes Requested"), supplier)).toMatchObject({
      label: "Pending update",
      tone: "info",
    });
  });

  it("reads as approved once the application is accepted", () => {
    expect(companyInfoCell(onb("Accepted"), supplier)).toMatchObject({ tone: "success" });
  });
});
