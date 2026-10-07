// Mock content for the Supplier Portal, keyed by supplierId so each persona
// (Martin Weber / EuroBau, Mehmet Yilmaz / Yilmaz Elektrotechnik) sees their own
// company, documents, requests and activity. This is prototype data — in a real
// build it would come from the API scoped to the signed-in supplier.

import { PRINCIPAL_COMPANY, PRINCIPAL_SHORT } from "@/lib/principal";

export type Tone = "critical" | "orange" | "medium" | "success" | "warning" | "neutral";

export type DocStatus = "valid" | "expiring" | "action-required";

export interface PortalDoc {
  id: string;
  name: string;
  category: string;
  expiryLabel: string;
  status: DocStatus;
}

/**
 * What fixing the item actually involves — this, not the hand-typed label,
 * decides whether the panel offers an upload or a form. Without it an expired
 * insurance certificate and a half-filled profile both read "Update".
 */
export type ActivityKind = "document" | "data" | "mixed";

export interface ActivityItem {
  id: string;
  title: string;
  /** Short status clause shown after an em-dash on the title line. */
  detail: string;
  principal: string;
  ageLabel: string;
  icon: "shield" | "file";
  kind: ActivityKind;
  /** Secondary button labels (Chat / Remind / Review); the primary comes from `kind`. */
  actions: string[];
  /** The compliance document this item is about — matched against SupplierDoc.documentName. */
  docName?: string;
  /** Profile fields this item asks the supplier to fill, for `data` and `mixed` items. */
  fields?: PortalFieldKey[];
  /** A change request sent before this session, so it can still be reviewed. */
  submitted?: { key: string; label: string; before: string; after: string }[];
}

/** Labels that mean "fix it", as opposed to chasing or re-reading an item. */
const PRIMARY_LABELS = new Set(["Update", "Upload", "Complete"]);

/**
 * The primary action, derived from the kind rather than read from `actions`, so
 * a document ticket can never ask the supplier to "Update" a file. Returns null
 * for items that carry nothing to fix — a pending approval or a resolved item is
 * read-only and only offers its secondary action.
 */
export function primaryActionLabel(item: ActivityItem): "Upload" | "Update" | null {
  if (!PRIMARY_LABELS.has(item.actions[0] ?? "")) return null;
  return item.kind === "data" ? "Update" : "Upload";
}

/** Everything after the primary action — Chat, Remind, Review — kept verbatim. */
export function secondaryActions(item: ActivityItem): string[] {
  return PRIMARY_LABELS.has(item.actions[0] ?? "") ? item.actions.slice(1) : item.actions;
}

/** One of the four Overview activity columns (Action required / Expiring soon / …). */
export interface OverviewGroup {
  key: string;
  label: string;
  /** Total items in this state. */
  count: number;
  tone: Tone;
  items: ActivityItem[];
}

export interface PrincipalChip {
  name: string;
  tone: "warning" | "neutral" | "success";
}

export interface PortalStat {
  /** Nav view this tile links to via its arrow. */
  key: string;
  label: string;
  value: string;
  hint?: string;
  principals?: PrincipalChip[];
}

export interface RequestedUpdate {
  id: string;
  from: string;
  principal: string;
  email: string;
  sentLabel: string;
  subject: string;
  /** Paragraphs of the message body. */
  body: string[];
  dueLabel: string;
}

/**
 * Flat names for the editable profile fields. Activity items reference these so
 * a panel can show only the fields its ticket is actually about, instead of the
 * whole company record.
 */
export type PortalFieldKey =
  | "legalName"
  | "vatId"
  | "registrationNo"
  | "website"
  | "street"
  | "city"
  | "postcode"
  | "country"
  | "iban"
  | "bankName"
  | "bic"
  | "contactName"
  | "contactEmail"
  | "contactPhone";

export interface CompanyDetails {
  legalName: string;
  vatId: string;
  registrationNo: string;
  website: string;
  associate: string;
  address: { street: string; city: string; postcode: string; country: string };
  payment: { iban: string; bankName: string; bic: string };
  /** Primary contact — the non-sensitive half of the profile, editable in place. */
  contact: { name: string; email: string; phone: string };
}

export interface NavCounts {
  overview?: number;
  "requested-updates"?: number;
  documents?: number;
  "price-agreements"?: number;
  "company-details"?: number;
}

export interface PortalProfile {
  fullName: string;
  firstName: string;
  role: string;
  stats: PortalStat[];
  overviewGroups: OverviewGroup[];
  documents: PortalDoc[];
  requestedUpdates: RequestedUpdate[];
  company: CompanyDetails;
}

const MARTIN: PortalProfile = {
  fullName: "Martin Weber",
  firstName: "Martin",
  role: "Supplier Manager",
  stats: [
    { key: "documents", label: "Documents", value: "2/6", hint: "1 expiring soon" },
    { key: "requested-updates", label: "Open Requests", value: "4", hint: "data change requests" },
    {
      key: "principals",
      label: "Compliance by principal",
      value: "1/4",
      principals: [
        { name: PRINCIPAL_SHORT, tone: "warning" },
        { name: "Wincasa", tone: "neutral" },
        { name: "GCH", tone: "neutral" },
        { name: "AT", tone: "success" },
      ],
    },
  ],
  overviewGroups: [
    {
      key: "action-required",
      label: "Action Required",
      count: 3,
      tone: "critical",
      items: [
        {
          id: "ar-1",
          title: "Public Liability Insurance",
          detail: "expired 8 days ago",
          principal: PRINCIPAL_SHORT,
          ageLabel: "8 days ago",
          icon: "shield",
          kind: "document",
          docName: "Public Liability Insurance",
          actions: ["Update", "Chat"],
        },
        {
          id: "ar-2",
          title: "Framework Contract",
          detail: "12 days to expiry",
          principal: PRINCIPAL_SHORT,
          ageLabel: "3 days ago",
          icon: "file",
          kind: "mixed",
          docName: "Framework Contract",
          fields: ["contactEmail"],
          actions: ["Upload", "Chat"],
        },
      ],
    },
    {
      key: "expiring-soon",
      label: "Expiring Soon",
      count: 5,
      tone: "warning",
      items: [
        {
          id: "es-1",
          title: "ISO 9001 Certificate",
          detail: "expiring in 30 days",
          principal: PRINCIPAL_SHORT,
          ageLabel: "1 day ago",
          icon: "shield",
          kind: "document",
          docName: "ISO 9001 Certificate",
          actions: ["Update", "Chat"],
        },
        {
          id: "es-2",
          title: "Profile completeness 61%",
          detail: "below 65% threshold",
          principal: PRINCIPAL_SHORT,
          ageLabel: "5 days ago",
          icon: "file",
          kind: "data",
          fields: ["contactName", "contactEmail", "contactPhone"],
          actions: ["Update", "Chat"],
        },
      ],
    },
    {
      key: "pending-approval",
      label: "Pending Approval",
      count: 3,
      tone: "medium",
      items: [
        {
          id: "pa-1",
          title: "Public Liability Insurance",
          detail: "expired 8 days ago",
          principal: PRINCIPAL_SHORT,
          ageLabel: "8 days ago",
          icon: "shield",
          kind: "document",
          docName: "Public Liability Insurance",
          actions: ["Remind"],
        },
        {
          id: "pa-2",
          title: "Framework Contract",
          detail: "12 days to expiry",
          principal: PRINCIPAL_SHORT,
          ageLabel: "3 days ago",
          icon: "file",
          kind: "document",
          docName: "Framework Contract",
          actions: ["Remind"],
        },
      ],
    },
    {
      key: "resolved",
      label: "Resolved",
      count: 5,
      tone: "success",
      items: [
        {
          id: "rs-1",
          title: "ISO 9001 Certificate",
          detail: "expiring in 30 days",
          principal: PRINCIPAL_SHORT,
          ageLabel: "1 day ago",
          icon: "shield",
          kind: "document",
          docName: "ISO 9001 Certificate",
          actions: ["Review"],
        },
        {
          id: "rs-2",
          title: "IBAN change request",
          detail: "awaiting first-eye endorsement",
          principal: PRINCIPAL_SHORT,
          ageLabel: "2 days ago",
          icon: "shield",
          kind: "data",
          fields: ["iban", "bankName", "bic"],
          submitted: [
            {
              key: "iban",
              label: "IBAN",
              before: "DE89 3704 0044 0532 0130 00",
              after: "DE12 5001 0517 0648 4898 90",
            },
            { key: "bankName", label: "Bank Name", before: "Commerzbank AG", after: "ING-DiBa AG" },
          ],
          actions: ["Review"],
        },
      ],
    },
  ],
  documents: [
    { id: "d-1", name: "Certificate of Incorporation", category: "Legal", expiryLabel: "Jan 2028", status: "valid" },
    { id: "d-2", name: "VAT Registration Certificate", category: "Tax", expiryLabel: "Ongoing", status: "valid" },
    { id: "d-3", name: "ISO 9001 Certificate", category: "Quality", expiryLabel: "14 Nov 2026", status: "valid" },
    { id: "d-4", name: "Public Liability Insurance", category: "Insurance", expiryLabel: "6 Aug 2026", status: "expiring" },
    { id: "d-5", name: "Trade Licence", category: "Legal", expiryLabel: "31 Jan 2027", status: "valid" },
    { id: "d-6", name: "Conflict Minerals Declaration", category: "Compliance", expiryLabel: "30 Sep 2026", status: "valid" },
  ],
  requestedUpdates: [
    {
      id: "ru-1",
      from: "Sabine Müller",
      principal: PRINCIPAL_SHORT,
      email: "procurement@urbanhabitat-management.de",
      sentLabel: "Today, 09:14",
      subject: "Please verify your banking details — EuroBau Components GmbH",
      body: [
        "Dear Martin,",
        "As part of our annual supplier data verification, we ask that you review and confirm your current banking details in Lynk. This is required before the next payment cycle on 15 July 2026.",
        "If your IBAN, bank name, or registered address has changed, please update it now. If nothing has changed, you can confirm your existing details with a single click.",
        "This takes less than 5 minutes. Any changes require approval from two Lynk team members before they take effect — your current payment details remain active in the meantime.",
      ],
      dueLabel: "Requested by 30 Jun 2026",
    },
    {
      id: "ru-2",
      from: "Thomas Becker",
      principal: PRINCIPAL_SHORT,
      email: "compliance@gch-group.com",
      sentLabel: "3 days ago",
      subject: "Confirm your primary contact details",
      body: [
        "Dear Martin,",
        "Our records show your primary contact information may be out of date. Please review the name, email and phone number we have on file and confirm or update them.",
      ],
      dueLabel: "Requested by 22 Jul 2026",
    },
  ],
  company: {
    legalName: "EuroBau Components GmbH",
    vatId: "DE 118 204 771",
    registrationNo: "HRB 118204",
    website: "www.eurobau-components.de",
    associate: "Berlin",
    address: { street: "Industriestraße 42", city: "Berlin", postcode: "10115", country: "Germany" },
    payment: { iban: "DE89 3704 0044 0532 0130 00", bankName: "Commerzbank AG", bic: "COBADEHHXXX" },
    contact: { name: "Martin Weber", email: "martin.weber@eurobau-components.de", phone: "" },
  },
};

const MEHMET: PortalProfile = {
  fullName: "Mehmet Yilmaz",
  firstName: "Mehmet",
  role: "Supplier Manager",
  stats: [
    { key: "documents", label: "Documents", value: "2/3", hint: "1 pending review" },
    { key: "requested-updates", label: "Open Requests", value: "1", hint: "onboarding task" },
    {
      key: "principals",
      label: "Compliance by principal",
      value: "0/2",
      principals: [
        { name: PRINCIPAL_SHORT, tone: "warning" },
        { name: "Wincasa", tone: "neutral" },
      ],
    },
  ],
  overviewGroups: [
    {
      key: "action-required",
      label: "Action Required",
      count: 2,
      tone: "critical",
      items: [
        {
          id: "m-ar-1",
          title: "Complete company profile",
          detail: "3 required fields missing",
          principal: PRINCIPAL_SHORT,
          ageLabel: "Today",
          icon: "file",
          kind: "data",
          fields: ["contactName", "contactEmail", "contactPhone"],
          actions: ["Complete", "Chat"],
        },
        {
          id: "m-ar-2",
          title: "Public Liability Insurance",
          detail: "not yet uploaded",
          principal: PRINCIPAL_SHORT,
          ageLabel: "Today",
          icon: "shield",
          kind: "document",
          docName: "Public Liability Insurance",
          actions: ["Upload", "Chat"],
        },
      ],
    },
    {
      key: "expiring-soon",
      label: "Expiring Soon",
      count: 0,
      tone: "warning",
      items: [],
    },
    {
      key: "pending-approval",
      label: "Pending Approval",
      count: 1,
      tone: "medium",
      items: [
        {
          id: "m-pa-1",
          title: "Trade Licence",
          detail: "awaiting principal review",
          principal: PRINCIPAL_SHORT,
          ageLabel: "1 day ago",
          icon: "file",
          kind: "document",
          docName: "Trade Licence",
          actions: ["Remind"],
        },
      ],
    },
    {
      key: "resolved",
      label: "Resolved",
      count: 0,
      tone: "success",
      items: [],
    },
  ],
  documents: [
    { id: "md-1", name: "Certificate of Incorporation", category: "Legal", expiryLabel: "Ongoing", status: "valid" },
    { id: "md-2", name: "VAT Registration Certificate", category: "Tax", expiryLabel: "Ongoing", status: "valid" },
    { id: "md-3", name: "Trade Licence", category: "Legal", expiryLabel: "Pending review", status: "action-required" },
  ],
  requestedUpdates: [
    {
      id: "m-ru-1",
      from: "Sabine Müller",
      principal: PRINCIPAL_SHORT,
      email: "procurement@urbanhabitat-management.de",
      sentLabel: "Yesterday, 14:02",
      subject: "Complete your onboarding — Yilmaz Elektrotechnik GmbH",
      body: [
        "Dear Mehmet,",
        `Welcome to Lynk. To activate your supplier account with ${PRINCIPAL_COMPANY}, please complete your company profile and upload your compliance documents.`,
        "Once submitted, your details will be reviewed by two members of our team before your account goes live.",
      ],
      dueLabel: "Requested by 25 Jul 2026",
    },
  ],
  company: {
    legalName: "Yilmaz Elektrotechnik GmbH",
    vatId: "DE 294 817 532",
    registrationNo: "HRB 214839",
    website: "www.yilmaz-elektrotechnik.de",
    associate: "Cologne",
    address: { street: "Mülheimer Straße 62", city: "Duisburg", postcode: "47057", country: "Germany" },
    payment: { iban: "DE89 3704 0044 0532 0130 00", bankName: "Commerzbank AG", bic: "COBADEFFXXX" },
    contact: { name: "", email: "", phone: "" },
  },
};

const PROFILES: Record<string, PortalProfile> = {
  supplier_martin_weber: MARTIN,
  supplier_mehmet_yilmaz: MEHMET,
};

/** Resolve the portal profile for a supplier, defaulting to Martin's demo data. */
export function getPortalProfile(supplierId: string): PortalProfile {
  return PROFILES[supplierId] ?? MARTIN;
}

const PRICE_AGREEMENT_KEYWORDS = /\b(contract|agreement|pricing|price)\b/i;
const COMPANY_DETAILS_KEYWORDS = /\b(bank|iban|address|company|contact|profile|details|vat|registration)\b/i;
const OVERVIEW_ALERT_GROUP_KEYS = new Set(["action-required", "expiring-soon"]);

function countPriceAgreementAlerts(profile: PortalProfile): number {
  return profile.overviewGroups
    .filter((group) => group.key !== "resolved")
    .flatMap((group) => group.items)
    .filter((item) => PRICE_AGREEMENT_KEYWORDS.test(`${item.title} ${item.detail}`)).length;
}

function countCompanyDetailAlerts(profile: PortalProfile): number {
  return profile.requestedUpdates.filter((request) =>
    COMPANY_DETAILS_KEYWORDS.test(`${request.subject} ${request.body.join(" ")}`)
  ).length;
}

export function getPortalNavCounts(profile: PortalProfile): NavCounts {
  const overviewAlerts = profile.overviewGroups
    .filter((group) => OVERVIEW_ALERT_GROUP_KEYS.has(group.key))
    .reduce((sum, group) => sum + group.items.length, 0);

  const documentAlerts = profile.documents.filter((doc) => doc.status !== "valid").length;
  const requestedUpdatesAlerts = profile.requestedUpdates.length;
  const priceAgreementAlerts = countPriceAgreementAlerts(profile);
  const companyDetailAlerts = countCompanyDetailAlerts(profile);

  return {
    overview: overviewAlerts || undefined,
    "requested-updates": requestedUpdatesAlerts || undefined,
    documents: documentAlerts || undefined,
    "price-agreements": priceAgreementAlerts || undefined,
    "company-details": companyDetailAlerts || undefined,
  };
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
