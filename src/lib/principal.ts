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
