// Mock content for the Supplier Portal, keyed by supplierId so each persona
// (Martin Weber / EuroBau, Mehmet Yilmaz / Yilmaz Elektrotechnik) sees their own
// company, documents, requests and activity. This is prototype data — in a real
// build it would come from the API scoped to the signed-in supplier.

export type Tone = "critical" | "orange" | "medium" | "success" | "warning" | "neutral";

export type DocStatus = "valid" | "expiring" | "action-required";

export interface PortalDoc {
  id: string;
  name: string;
  category: string;
  expiryLabel: string;
  status: DocStatus;
}

export interface ActivityItem {
  id: string;
  title: string;
  /** Short status clause shown after an em-dash on the title line. */
  detail: string;
  principal: string;
  ageLabel: string;
  icon: "shield" | "file";
  /** Button labels, first is the primary/dark action. */
  actions: string[];
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

export interface CompanyDetails {
  legalName: string;
  vatId: string;
  registrationNo: string;
  website: string;
  associate: string;
  address: { street: string; city: string; postcode: string; country: string };
  payment: { iban: string; bankName: string; bic: string };
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
      value: "1/3",
      principals: [
        { name: "Wincasa", tone: "warning" },
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
          principal: "Wincasa",
          ageLabel: "8 days ago",
          icon: "shield",
          actions: ["Update", "Chat"],
        },
        {
          id: "ar-2",
          title: "Framework Contract",
          detail: "12 days to expiry",
          principal: "GCH",
          ageLabel: "3 days ago",
          icon: "file",
          actions: ["Upload", "Chat"],
        },
      ],
    },
    {
      key: "expiring-soon",
      label: "Expiring Soon",
      count: 5,
      tone: "orange",
      items: [
        {
          id: "es-1",
          title: "ISO 9001 Certificate",
          detail: "expiring in 30 days",
          principal: "GCH",
          ageLabel: "1 day ago",
          icon: "shield",
          actions: ["Update", "Chat"],
        },
        {
          id: "es-2",
          title: "Profile completeness 61%",
          detail: "below 65% threshold",
          principal: "GCH",
          ageLabel: "5 days ago",
          icon: "file",
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
          principal: "Wincasa",
          ageLabel: "8 days ago",
          icon: "shield",
          actions: ["Remind"],
        },
        {
          id: "pa-2",
          title: "Framework Contract",
          detail: "12 days to expiry",
          principal: "GCH",
          ageLabel: "3 days ago",
          icon: "file",
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
          principal: "Wincasa",
          ageLabel: "1 day ago",
          icon: "shield",
          actions: ["Review"],
        },
        {
          id: "rs-2",
          title: "IBAN change request",
          detail: "awaiting first-eye endorsement",
          principal: "GCH",
          ageLabel: "2 days ago",
          icon: "shield",
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
      principal: "Wincasa",
      email: "procurement@yarowa-ag.com",
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
      principal: "GCH",
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
    associate: "Wincasa",
    address: { street: "Industriestraße 42", city: "Berlin", postcode: "10115", country: "Germany" },
    payment: { iban: "DE89 3704 0044 0532 0130 00", bankName: "Commerzbank AG", bic: "COBADEHHXXX" },
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
      value: "0/1",
      principals: [{ name: "AT", tone: "warning" }],
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
          principal: "AT Immobilien",
          ageLabel: "Today",
          icon: "file",
          actions: ["Complete", "Chat"],
        },
        {
          id: "m-ar-2",
          title: "Public Liability Insurance",
          detail: "not yet uploaded",
          principal: "AT Immobilien",
          ageLabel: "Today",
          icon: "shield",
          actions: ["Upload", "Chat"],
        },
      ],
    },
    {
      key: "expiring-soon",
      label: "Expiring Soon",
      count: 0,
      tone: "orange",
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
          principal: "AT Immobilien",
          ageLabel: "1 day ago",
          icon: "file",
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
      principal: "AT Immobilien",
      email: "procurement@yarowa-ag.com",
      sentLabel: "Yesterday, 14:02",
      subject: "Complete your onboarding — Yilmaz Elektrotechnik GmbH",
      body: [
        "Dear Mehmet,",
        "Welcome to Lynk. To activate your supplier account with AT Immobilien, please complete your company profile and upload your compliance documents.",
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
    associate: "Mülheimer",
    address: { street: "Mülheimer Straße 62", city: "Duisburg", postcode: "47057", country: "Germany" },
    payment: { iban: "DE89 3704 0044 0532 0130 00", bankName: "Commerzbank AG", bic: "COBADEFFXXX" },
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
