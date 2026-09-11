import { PRINCIPAL_COMPANY } from "./principal";

/**
 * Supplier onboarding terms shown before a prospect enters any data.
 *
 * Versioned on purpose: consent is only meaningful if you can say *which* terms
 * were accepted and when, so the version and effective date are displayed with
 * the checkbox and are what an audit trail would record.
 */
export const TERMS_VERSION = "1.0";
export const TERMS_EFFECTIVE_DATE = "1 July 2026";

export interface TermsSection {
  heading: string;
  body: string;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    heading: "1. What you are agreeing to",
    body: `By continuing you register your company as a supplier of ${PRINCIPAL_COMPANY} on the Lynk platform and confirm you are authorised to act for it.`,
  },
  {
    heading: "2. Accuracy of the information you submit",
    body: "Company details, certificates and other documents must be accurate, current and issued to your company. Submitting incorrect or forged documents can end the qualification and any existing relationship.",
  },
  {
    heading: "3. How your data is used",
    body: `Your company data and documents are processed to qualify and monitor you as a supplier: verification, expiry tracking and compliance reporting. They are visible to authorised procurement staff of ${PRINCIPAL_COMPANY} and are not sold or used for advertising.`,
  },
  {
    heading: "4. Keeping documents valid",
    body: "You keep certificates up to date and replace them before they expire. The platform notifies you ahead of an expiry; an expired mandatory document can suspend you from new work orders.",
  },
  {
    heading: "5. Retention",
    body: "Submitted data is kept for the duration of the relationship and afterwards only as long as statutory retention obligations require, then deleted.",
  },
  {
    heading: "6. Your rights (GDPR)",
    body: "You may request access to, correction of, or deletion of your data, and withdraw consent at any time. Withdrawing consent may mean the supplier relationship cannot continue.",
  },
  {
    heading: "7. Confidentiality",
    body: "Prices, catalogues and other commercial information exchanged through the platform are confidential and must not be passed to third parties without written permission.",
  },
];
