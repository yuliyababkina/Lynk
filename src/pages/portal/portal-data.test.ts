import { describe, expect, it } from "vitest";
import {
  getPortalProfile,
  primaryActionLabel,
  secondaryActions,
  type ActivityItem,
  type ActivityKind,
} from "./portal-data";

/*
 * The rule these cover: what a ticket offers to do about itself is decided by
 * its kind, not by a label typed into the mock data. Before this, an expired
 * insurance certificate and a half-filled profile both said "Update", and the
 * supplier was invited to edit a PDF.
 */

function item(kind: ActivityKind, actions: string[]): ActivityItem {
  return {
    id: "t-1",
    title: "Test",
    detail: "",
    principal: "Urban Habitat",
    ageLabel: "today",
    icon: "file",
    kind,
    actions,
  };
}

describe("primaryActionLabel", () => {
  it("asks for a file when the ticket is about a document", () => {
    expect(primaryActionLabel(item("document", ["Update", "Chat"]))).toBe("Upload");
  });

  it("asks for a file for a mixed ticket too — the file is the point, the field rides along", () => {
    expect(primaryActionLabel(item("mixed", ["Upload", "Chat"]))).toBe("Upload");
  });

  it("asks for an edit when the ticket is about profile data", () => {
    expect(primaryActionLabel(item("data", ["Complete", "Chat"]))).toBe("Update");
  });

  it("overrides a hand-typed label that contradicts the kind", () => {
    // "Update" on a document is exactly the bug this derivation exists to stop.
    expect(primaryActionLabel(item("document", ["Update"]))).toBe("Upload");
  });

  it("offers nothing on an item waiting for someone else", () => {
    expect(primaryActionLabel(item("document", ["Remind"]))).toBeNull();
  });

  it("offers nothing on a closed item", () => {
    expect(primaryActionLabel(item("data", ["Review"]))).toBeNull();
  });

  it("offers nothing when there are no actions at all", () => {
    expect(primaryActionLabel(item("document", []))).toBeNull();
  });
});

describe("secondaryActions", () => {
  it("drops the primary and keeps the rest verbatim", () => {
    expect(secondaryActions(item("document", ["Upload", "Chat"]))).toEqual(["Chat"]);
  });

  it("keeps every action when none of them is a primary", () => {
    expect(secondaryActions(item("document", ["Remind"]))).toEqual(["Remind"]);
    expect(secondaryActions(item("data", ["Review"]))).toEqual(["Review"]);
  });
});

describe("the seeded demo tickets", () => {
  const martin = getPortalProfile("supplier_martin_weber");
  const mehmet = getPortalProfile("supplier_mehmet_yilmaz");
  const all = [...martin.overviewGroups, ...mehmet.overviewGroups].flatMap((g) => g.items);

  it("gives every ticket a kind — an unkinded one would silently fall back to Upload", () => {
    for (const t of all) expect(t.kind, t.id).toBeDefined();
  });

  it("points every document ticket at a document", () => {
    for (const t of all.filter((x) => x.kind !== "data")) expect(t.docName, t.id).toBeTruthy();
  });

  it("names the fields every data ticket is about", () => {
    for (const t of all.filter((x) => x.kind === "data")) expect(t.fields?.length, t.id).toBeGreaterThan(0);
  });

  it("labels the documents Upload and the profile tickets Update", () => {
    const labelled = all
      .filter((t) => primaryActionLabel(t) !== null)
      .map((t) => `${t.title}: ${primaryActionLabel(t)}`);
    expect(labelled).toEqual([
      "Public Liability Insurance: Upload",
      "Framework Contract: Upload",
      "ISO 9001 Certificate: Upload",
      "Profile completeness 61%: Update",
      "Complete company profile: Update",
      "Public Liability Insurance: Upload",
    ]);
  });

  it("leaves Mehmet's contact blank, so his '3 required fields missing' is true", () => {
    const { contact } = mehmet.company;
    expect([contact.name, contact.email, contact.phone]).toEqual(["", "", ""]);
  });
});
