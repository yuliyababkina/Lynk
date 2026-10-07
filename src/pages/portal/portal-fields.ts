import type { CompanyDetails, PortalFieldKey } from "./portal-data";

/*
 * One description per editable profile field: where it lives in the company
 * record, what to call it, whether changing it needs approval, and how to tell a
 * valid value from an invalid one.
 *
 * The sensitive flag is the important part. A supplier can correct their own
 * phone number unilaterally, but anything that decides where money goes, or who
 * the company legally is, only moves after a principal has endorsed it — the
 * same rule the PM-side IBAN change request already follows.
 */

export interface PortalFieldSpec {
  label: string;
  /** Payment and identity fields: saved as a change request, never applied directly. */
  sensitive: boolean;
  mono?: boolean;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  read: (c: CompanyDetails) => string;
  write: (c: CompanyDetails, value: string) => CompanyDetails;
  /** Returns an error message, or null when the value is acceptable. */
  validate?: (value: string) => string | null;
}

const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9 ]{10,30}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateIban(value: string): string | null {
  // Format only — a real build would checksum it (mod-97). Spacing is ignored
  // because banks print IBANs in groups and suppliers paste them that way.
  return IBAN.test(value.trim()) ? null : "Enter a valid IBAN, e.g. DE89 3704 0044 0532 0130 00.";
}

function validateEmail(value: string): string | null {
  return EMAIL.test(value.trim()) ? null : "Enter a valid email address.";
}

export const PORTAL_FIELDS: Record<PortalFieldKey, PortalFieldSpec> = {
  legalName: {
    label: "Legal Name",
    sensitive: true,
    read: (c) => c.legalName,
    write: (c, v) => ({ ...c, legalName: v }),
  },
  vatId: {
    label: "VAT ID",
    sensitive: true,
    read: (c) => c.vatId,
    write: (c, v) => ({ ...c, vatId: v }),
  },
  registrationNo: {
    label: "Registration No.",
    sensitive: true,
    read: (c) => c.registrationNo,
    write: (c, v) => ({ ...c, registrationNo: v }),
  },
  website: {
    label: "Website",
    sensitive: false,
    placeholder: "www.example.de",
    read: (c) => c.website,
    write: (c, v) => ({ ...c, website: v }),
  },
  street: {
    label: "Street",
    sensitive: false,
    read: (c) => c.address.street,
    write: (c, v) => ({ ...c, address: { ...c.address, street: v } }),
  },
  city: {
    label: "City",
    sensitive: false,
    read: (c) => c.address.city,
    write: (c, v) => ({ ...c, address: { ...c.address, city: v } }),
  },
  postcode: {
    label: "Postcode",
    sensitive: false,
    read: (c) => c.address.postcode,
    write: (c, v) => ({ ...c, address: { ...c.address, postcode: v } }),
  },
  country: {
    label: "Country",
    sensitive: false,
    read: (c) => c.address.country,
    write: (c, v) => ({ ...c, address: { ...c.address, country: v } }),
  },
  iban: {
    label: "IBAN",
    sensitive: true,
    mono: true,
    placeholder: "DE89 3704 0044 0532 0130 00",
    read: (c) => c.payment.iban,
    write: (c, v) => ({ ...c, payment: { ...c.payment, iban: v } }),
    validate: validateIban,
  },
  bankName: {
    label: "Bank Name",
    sensitive: true,
    read: (c) => c.payment.bankName,
    write: (c, v) => ({ ...c, payment: { ...c.payment, bankName: v } }),
  },
  bic: {
    label: "BIC / SWIFT",
    sensitive: true,
    mono: true,
    read: (c) => c.payment.bic,
    write: (c, v) => ({ ...c, payment: { ...c.payment, bic: v } }),
  },
  contactName: {
    label: "Contact person",
    sensitive: false,
    placeholder: "Full name",
    read: (c) => c.contact.name,
    write: (c, v) => ({ ...c, contact: { ...c.contact, name: v } }),
  },
  contactEmail: {
    label: "Contact email",
    sensitive: false,
    type: "email",
    placeholder: "name@company.de",
    read: (c) => c.contact.email,
    write: (c, v) => ({ ...c, contact: { ...c.contact, email: v } }),
    validate: validateEmail,
  },
  contactPhone: {
    label: "Contact phone",
    sensitive: false,
    type: "tel",
    placeholder: "+49 …",
    read: (c) => c.contact.phone,
    write: (c, v) => ({ ...c, contact: { ...c.contact, phone: v } }),
  },
};

/** True when any field in the set needs a principal's endorsement. */
export function hasSensitiveField(keys: PortalFieldKey[]): boolean {
  return keys.some((k) => PORTAL_FIELDS[k].sensitive);
}

/** Every field is required; a blank one fails before its format is checked. */
export function fieldError(key: PortalFieldKey, value: string): string | null {
  if (value.trim() === "") return "This field is required.";
  return PORTAL_FIELDS[key].validate?.(value) ?? null;
}
