// Canonical set of compliance documents every prospect is expected to submit
// during onboarding. Used by the Procurement Manager's review stepper to show
// a complete checklist — including documents the supplier hasn't uploaded yet
// (rendered as "Missing") — rather than only listing what happens to exist.
export interface OnboardingDocumentType {
  name: string;
  category: string;
}

export const STANDARD_DOCUMENT_TYPES: OnboardingDocumentType[] = [
  { name: "Certificate of Incorporation", category: "Legal" },
  { name: "VAT Registration Certificate", category: "Tax" },
  { name: "Public Liability Insurance", category: "Insurance" },
  { name: "Bank Confirmation Letter", category: "Finance" },
  { name: "Trade Licence", category: "Legal" },
];

/** Document kinds the uploader picks from. */
export const DOCUMENT_TYPE_OPTIONS = [
  "Certificate",
  "Licence",
  "Insurance Policy",
  "Registration",
  "Declaration",
  "Bank Letter",
  "Standard / ISO Certificate",
  "Other",
] as const;

/** Metadata the uploader confirms for each file. */
export interface DocumentMetadata {
  documentType: string;
  issuingInstitution: string;
  expiryDate: string;
  doesNotExpire: boolean;
}

/**
 * Known shape of each standard document: what kind it is, who typically issues
 * it, and whether it carries an expiry at all. Drives the pre-filled values the
 * uploader reviews.
 */
const KNOWN: Record<string, { documentType: string; issuingInstitution: string; expires: boolean }> = {
  "Certificate of Incorporation": {
    documentType: "Certificate",
    issuingInstitution: "Commercial Register (Handelsregister)",
    // Incorporation certificates are issued once and don't lapse.
    expires: false,
  },
  "VAT Registration Certificate": {
    documentType: "Registration",
    issuingInstitution: "Federal Central Tax Office (BZSt)",
    expires: false,
  },
  "Public Liability Insurance": {
    documentType: "Insurance Policy",
    issuingInstitution: "",
    expires: true,
  },
  "Bank Confirmation Letter": {
    documentType: "Bank Letter",
    issuingInstitution: "",
    expires: true,
  },
  "Trade Licence": {
    documentType: "Licence",
    issuingInstitution: "Local Trade Office (Gewerbeamt)",
    expires: true,
  },
  "ISO 9001 Certificate": {
    documentType: "Standard / ISO Certificate",
    issuingInstitution: "",
    expires: true,
  },
  "Conflict Minerals Declaration": {
    documentType: "Declaration",
    issuingInstitution: "",
    expires: true,
  },
};

/** Fallback keyword matching for documents outside the known set. */
function guessType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("iso")) return "Standard / ISO Certificate";
  if (n.includes("insurance") || n.includes("liability")) return "Insurance Policy";
  if (n.includes("licence") || n.includes("license")) return "Licence";
  if (n.includes("declaration")) return "Declaration";
  if (n.includes("registration")) return "Registration";
  if (n.includes("bank")) return "Bank Letter";
  if (n.includes("certificate")) return "Certificate";
  return "Other";
}

/**
 * "Recognises" a freshly uploaded document and proposes metadata for the
 * uploader to review. This is a heuristic over the document name — a real build
 * would run OCR/extraction here; the confirm-before-save step is the same either
 * way, which is the point: the human always verifies the values.
 */
export function recogniseDocumentMetadata(documentName: string): DocumentMetadata {
  const known = KNOWN[documentName];
  if (known) {
    return {
      documentType: known.documentType,
      issuingInstitution: known.issuingInstitution,
      expiryDate: "",
      doesNotExpire: !known.expires,
    };
  }
  return { documentType: guessType(documentName), issuingInstitution: "", expiryDate: "", doesNotExpire: false };
}
