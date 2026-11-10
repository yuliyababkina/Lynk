import { describe, expect, it } from "vitest";
import { relationshipId, parseRelationshipId, onboardingCaseId, onboardingSupplierId } from "./db";

/*
 * The relationship id is the whole of requirement 1 — every chat query is scoped
 * by it — so it is worth pinning down rather than trusting by inspection.
 */
describe("relationshipId", () => {
  const URBAN = "principal_urban_habitat";
  const WINCASA = "principal_wincasa";
  const MARTIN = "supplier_martin_weber";
  const MEHMET = "supplier_mehmet_yilmaz";

  it("gives each principal a different conversation with the same supplier", () => {
    // One supplier account, several principals: the ids must not collide, or a
    // principal would read another's thread.
    expect(relationshipId(URBAN, MARTIN)).not.toBe(relationshipId(WINCASA, MARTIN));
  });

  it("gives each supplier a different conversation with the same principal", () => {
    expect(relationshipId(URBAN, MARTIN)).not.toBe(relationshipId(URBAN, MEHMET));
  });

  it("is stable, so a conversation survives reloads and status changes", () => {
    expect(relationshipId(URBAN, MARTIN)).toBe(relationshipId(URBAN, MARTIN));
  });

  it("round-trips, even though both halves contain underscores", () => {
    // The original underscore-joined format could not be taken apart again:
    // `rel_principal_urban_habitat_supplier_martin_weber` has no unambiguous
    // split point. api/notify-unread.js needs the supplier id back out.
    expect(parseRelationshipId(relationshipId(URBAN, MARTIN))).toEqual({
      principalId: URBAN,
      supplierId: MARTIN,
    });
  });

  it("does not change when a prospect becomes a supplier", () => {
    // Built from the two parties, never from the relationship's status — which
    // is what lets the conversation continue through acceptance.
    const asProspect = relationshipId(URBAN, MEHMET);
    const asSupplier = relationshipId(URBAN, MEHMET);
    expect(asProspect).toBe(asSupplier);
  });

  it("lines up with the onboarding-case convention", () => {
    // notify-unread finds a prospect's email by going from the relationship id
    // to `onb-<supplierId>`; this is that hop.
    const { supplierId } = parseRelationshipId(relationshipId(URBAN, MEHMET));
    expect(onboardingSupplierId(onboardingCaseId(supplierId))).toBe(MEHMET);
  });
});
