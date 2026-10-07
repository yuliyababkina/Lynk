import { describe, expect, it } from "vitest";
import { PORTAL_FIELDS, fieldError, hasSensitiveField } from "./portal-fields";
import type { CompanyDetails, PortalFieldKey } from "./portal-data";

/*
 * These decide two things the supplier can't see: whether a value is allowed
 * through at all, and whether changing it needs a principal's endorsement. The
 * second is the one with consequences — a bank detail that slipped onto the
 * direct-save path would redirect payments without anyone approving it.
 */

const COMPANY: CompanyDetails = {
  legalName: "EuroBau Components GmbH",
  vatId: "DE 118 204 771",
  registrationNo: "HRB 118204",
  website: "www.eurobau-components.de",
  associate: "Berlin",
  address: { street: "Industriestraße 42", city: "Berlin", postcode: "10115", country: "Germany" },
  payment: { iban: "DE89 3704 0044 0532 0130 00", bankName: "Commerzbank AG", bic: "COBADEHHXXX" },
  contact: { name: "Martin Weber", email: "martin.weber@eurobau-components.de", phone: "" },
};

describe("what counts as sensitive", () => {
  const sensitive: PortalFieldKey[] = ["iban", "bic", "bankName", "legalName", "vatId", "registrationNo"];
  const direct: PortalFieldKey[] = ["contactName", "contactEmail", "contactPhone", "website", "street", "city", "postcode", "country"];

  it.each(sensitive)("%s needs endorsement", (key) => {
    expect(PORTAL_FIELDS[key].sensitive).toBe(true);
  });

  it.each(direct)("%s saves directly", (key) => {
    expect(PORTAL_FIELDS[key].sensitive).toBe(false);
  });

  it("treats a mixed set as sensitive — the cautious way round", () => {
    expect(hasSensitiveField(["contactPhone", "iban"])).toBe(true);
  });

  it("only clears a set with nothing sensitive in it", () => {
    expect(hasSensitiveField(["contactPhone", "contactEmail"])).toBe(false);
    expect(hasSensitiveField([])).toBe(false);
  });
});

describe("validation", () => {
  it("rejects a blank value before looking at its format", () => {
    expect(fieldError("contactName", "")).toBe("This field is required.");
    expect(fieldError("contactEmail", "   ")).toBe("This field is required.");
  });

  it("accepts an IBAN as banks print it, in groups", () => {
    expect(fieldError("iban", "DE89 3704 0044 0532 0130 00")).toBeNull();
    expect(fieldError("iban", "DE89370400440532013000")).toBeNull();
  });

  it("rejects an IBAN that isn't one", () => {
    expect(fieldError("iban", "nonsense")).toMatch(/valid IBAN/);
    expect(fieldError("iban", "1234 5678")).toMatch(/valid IBAN/); // no country prefix
  });

  it("accepts a real email and rejects the near-misses", () => {
    expect(fieldError("contactEmail", "martin@eurobau.de")).toBeNull();
    expect(fieldError("contactEmail", "martin@eurobau")).toMatch(/valid email/);
    expect(fieldError("contactEmail", "martin eurobau.de")).toMatch(/valid email/);
  });

  it("leaves fields with no format rule alone once they're filled", () => {
    expect(fieldError("contactPhone", "+49 30 1234 567")).toBeNull();
    expect(fieldError("bankName", "ING-DiBa AG")).toBeNull();
  });
});

describe("reading and writing a field", () => {
  it("reaches nested values without the caller knowing the shape", () => {
    expect(PORTAL_FIELDS.iban.read(COMPANY)).toBe("DE89 3704 0044 0532 0130 00");
    expect(PORTAL_FIELDS.city.read(COMPANY)).toBe("Berlin");
    expect(PORTAL_FIELDS.contactName.read(COMPANY)).toBe("Martin Weber");
  });

  it("writes without mutating the record it was given", () => {
    const next = PORTAL_FIELDS.contactPhone.write(COMPANY, "+49 30 777 000");
    expect(next.contact.phone).toBe("+49 30 777 000");
    expect(COMPANY.contact.phone).toBe(""); // original untouched
    expect(next.contact.name).toBe("Martin Weber"); // siblings carried over
  });

  it("round-trips every field", () => {
    for (const key of Object.keys(PORTAL_FIELDS) as PortalFieldKey[]) {
      const written = PORTAL_FIELDS[key].write(COMPANY, "changed");
      expect(PORTAL_FIELDS[key].read(written), key).toBe("changed");
    }
  });
});
