/**
 * The Principal running this Lynk tenant — the company whose procurement team
 * invites and qualifies suppliers, and the person signing those invitations.
 *
 * Kept in one place so the onboarding screens and the invitation email always
 * name the same company; these used to be hard-coded separately and drifted.
 * Fictional data for the prototype.
 */
export const PRINCIPAL_COMPANY = "Urban Habitat Management GmbH";
/** Compact form for chips, badges and activity rows where the legal name is too long. */
export const PRINCIPAL_SHORT = "Urban Habitat";
export const PROCUREMENT_MANAGER = "Sabine Müller";
export const PROCUREMENT_MANAGER_ROLE = "Procurement Manager";
export const PROCUREMENT_EMAIL = "procurement@urbanhabitat-management.de";

/**
 * Contracts the Principal sends a prospect once procurement has approved all of
 * their data and documents. The prospect reviews and signs the main agreement
 * plus the pricing catalogues; signing them all activates them as a supplier.
 */
export interface PrincipalContract {
  id: string;
  name: string;
  kind: "contract" | "catalogue";
  summary: string;
  /** Version / validity line shown under the name. */
  meta: string;
}

/**
 * Contract templates the Procurement Manager can send to an approved prospect.
 * Template management itself is out of scope — this is the finite pick list.
 */
export const CONTRACT_TEMPLATES = [
  "Master Supply Agreement (v3.2)",
  "Framework Agreement — Services (v2.1)",
  "Framework Agreement — Goods (v2.1)",
] as const;

export const PRINCIPAL_CONTRACTS: PrincipalContract[] = [
  {
    id: "msa",
    name: "Master Supply Agreement",
    kind: "contract",
    summary: `The framework governing your supply relationship with ${PRINCIPAL_COMPANY} — scope, liability, payment terms and SLAs.`,
    meta: "v3.2 · Effective on signature",
  },
  {
    id: "cat-painting",
    name: "Painting Services — Price List 2027",
    kind: "catalogue",
    summary: "Agreed rates for painting works across all contracted regions for the 2027 period.",
    meta: "2027 · 42 line items",
  },
  {
    id: "cat-renovation",
    name: "Renovation Services — Price List 2027",
    kind: "catalogue",
    summary: "Agreed rates for renovation and drywall works, including call-out and materials handling.",
    meta: "2027 · 28 line items",
  },
];

/** Full company profile, for screens that show the Principal's own details. */
export const PRINCIPAL_PROFILE = {
  name: PRINCIPAL_COMPANY,
  industry: "Property & Facility Management",
  legalForm: "GmbH",
  headOffice: "Frankfurt am Main, Germany",
  regionalOffices: ["Berlin", "Hamburg", "Munich", "Cologne"],
  website: "www.urbanhabitat-management.de",
  // Invented, plausible-looking identifiers — replace if the fiction needs
  // specific numbers.
  commercialRegister: "HRB 87421 (Frankfurt am Main)",
  vatId: "DE 812 447 903",
} as const;
