export type Criticality = "critical" | "high" | "medium" | "low";

/** Workflow status of a Task Queue ticket. */
export type TicketStatus = "To do" | "In progress" | "Resolved";

export type TicketSource =
  | "compliance-monitoring"
  | "contracts"
  | "data-governance"
  | "onboarding"
  | "prospect"
  | "data-quality";

export type TicketCategory =
  | "Document compliance"
  | "Data governance"
  | "Contracts"
  | "Service agreements"
  | "Onboarding";

export interface Ticket {
  id: string;
  title: string;
  criticality: Criticality;
  entityName: string;
  entityType: "Supplier" | "Prospect" | "Service Provider";
  ageLabel: string;
  primaryAction: string;
  source: TicketSource;
  category: TicketCategory;
  targetId?: string;
  /** Workflow status. Defaults to "To do" when the DB row predates the column. */
  status?: TicketStatus;
  /** Legacy flag kept in sync with status === "Resolved" for backward compatibility. */
  resolved?: boolean;
}

export type SupplierStage = "prospect" | "supplier" | "provider" | "inactive";

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  primary?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  stage: SupplierStage;
  relationshipId: string;
  trade: string;
  region: string;
  compliance: "Fully Compliant" | "Pending Review" | "Blocked" | "Action Required" | "—";
  rating: number | null;
  openTickets: number;
  contacts: Contact[];
  regionsServed: string[];
  capabilities: string[];
  vatId?: string;
  iban?: string;
  address?: string;
  lastActive: string;
  /** When this supplier accepted the Terms & Conditions. Unset = not accepted,
   * and nothing may be saved for them until it is. Lives here rather than on
   * the onboarding case because acceptance outlives onboarding, and established
   * suppliers have no case at all. */
  termsAcceptedAt?: string;
  /** Which version was accepted (the terms change over time). */
  termsVersion?: string;
  /** Who accepted, for the audit trail. */
  termsAcceptedBy?: string;
}

export type DocStatus =
  | "valid"
  | "warning-60"
  | "warning-30"
  | "pending-review"
  | "rejected-resubmit"
  | "blocked";

export type ComplianceEventType =
  | "verified"
  | "warning"
  | "reminder"
  | "notification"
  | "blocked"
  | "upload";

export interface ComplianceEvent {
  date: string;
  event: string;
  actor: string;
  type?: ComplianceEventType;
}

export interface RenewalUpload {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SupplierDoc {
  id: string;
  supplierId: string;
  supplierName: string;
  trade: string;
  documentName: string;
  documentCategory: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: DocStatus;
  /** Date the 30-day auto-notification was sent to the supplier portal. */
  autoNotified?: string;
  /** Contextual note explaining the current status (shown in the drawer callout). */
  statusNote?: string;
  /** A renewal file the supplier uploaded that is awaiting the manager's review. */
  renewal?: RenewalUpload;
  history: ComplianceEvent[];
  /** Storage object path + public URL for the CURRENT valid file, if one has been attached. */
  filePath?: string;
  fileUrl?: string;
  /** Kind of document — Certificate / Licence / Insurance Policy / … */
  documentType?: string;
  /** Authority or company that issued it (TÜV, Chamber of Commerce, insurer…). */
  issuingInstitution?: string;
  /** True for documents with no expiry (e.g. VAT registration). */
  doesNotExpire?: boolean;
  /** True once the uploader reviewed the pre-filled metadata instead of accepting it blindly. */
  metadataConfirmed?: boolean;
}

export type ContractStatus = "Active" | "Expiring Soon" | "Renewal Urgent" | "Renewal in Progress" | "Opted Out";

export interface Contract {
  id: string;
  supplierName: string;
  ref: string;
  type: "Framework" | "Master Supply" | "Service Agreement";
  annualValue: number;
  endDate: string;
  renewalBy: string;
  noticePeriod: string;
  timeLeftLabel: string;
  status: ContractStatus;
}

export interface DataGovernanceRequest {
  id: string;
  supplierName: string;
  category: string;
  risk: "Critical" | "Standard";
  requestedBy: string;
  requestedAt: string;
  reason: string;
  fields: { label: string; before: string; after: string; sensitive?: boolean }[];
  status: "Awaiting Review" | "Endorsed — Awaiting 2nd Approval" | "Approved" | "Rejected";
  approvalStep: 1 | 2;
}

export type OnboardingStatus =
  /** Invitation revoked or not yet sent — no live magic link. */
  | "Draft"
  | "Stale"
  | "Pending"
  | "Opened"
  | "In Review"
  | "Changes Requested"
  /** Contract + catalogues sent to the supplier; waiting on their signature. */
  | "Contract Sent (Pending Signature)"
  | "Accepted"
  | "Rejected";

export interface OnboardingCase {
  id: string;
  companyName: string;
  contactName: string;
  status: OnboardingStatus;
  daysNoResponse: number;
  criticality: Criticality;
  /** PM feedback attached on a "Changes Requested" or "Rejected" decision.
   * Shown to the prospect so they know what to fix. */
  reviewNote?: string;
  /** Prospect's contact email — where the invitation / magic link was sent. */
  email?: string;
  /** Unique token embedded in the invite's magic link (?invite=<inviteToken>)
   * so a click can be resolved back to this case without a login. */
  inviteToken?: string;
}

/**
 * How a company typed into the invite flow relates to the platform:
 *  - "new"        → not on Lynk; gets an email onboarding invitation
 *  - "on-lynk"    → has a verified profile elsewhere; gets a connection request
 *  - "connected"  → already active in your network; nothing to do
 */
export type InviteMatch = "new" | "on-lynk" | "connected";

export interface DirectoryCompany {
  name: string;
  trade: string;
  city: string;
  rating?: number;
  state: InviteMatch;
}

export type CatalogueStatus = "Active" | "Draft" | "Upcoming";
export type ResponseModel = "actively-agree" | "actively-disagree";
export type CatalogueLineChange = "added" | "changed" | "removed" | "unchanged";

export interface CatalogueLine {
  id: string;
  service: string;
  category: string;
  unit: string;
  rate: number;
}

export interface CatalogueLineDiff extends CatalogueLine {
  change: CatalogueLineChange;
  previousRate?: number;
}

export interface CatalogueVersionEntry {
  version: string;
  publishedAt: string;
  note: string;
}

export interface CatalogueSupplier {
  id: string;
  name: string;
  region: string;
  confirmed: boolean;
}

export interface Catalogue {
  id: string;
  name: string;
  trade: string;
  region: string;
  status: CatalogueStatus;
  versionLabel: string;
  currentVersion: string;
  awaitingFirstResponse: boolean;
  validFrom: string;
  validTo: string;
  responseModel: ResponseModel;
  services: CatalogueLine[];
  versions: CatalogueVersionEntry[];
  suppliers: CatalogueSupplier[];
}

/* Portal types */
export interface Principal {
  id: string;
  name: string;
  associatesCount?: number;
}

export type RelationshipStatus = "prospect" | "supplier" | "provider" | "inactive";

export interface SupplierPrincipalRelationship {
  id: string;
  supplierProfileId: string;
  principalId: string;
  principalName: string;
  status: RelationshipStatus;
  /** @deprecated Derived from chat_messages now — see useLynkData().unreadFor(). */
  unreadCount: number;
  pendingCount: number;
  rejectedCount: number;
  /** @deprecated Derived from chat_messages now — see useLynkData().lastMessageFor(). */
  lastMessage?: { from: string; text: string; at: string };
}

/* Chat ------------------------------------------------------------------- */

/** Which end of a relationship acted. `system` is the app itself, narrating a
 * lifecycle event (invited / changes requested / accepted / rejected / new
 * application) into the conversation. */
export type ChatSide = "principal" | "supplier";
export type ChatAuthorSide = ChatSide | "system";

/** What a message points at. Chat holds no files — a document message links to
 * the normal upload flow instead of carrying an attachment. */
export type ChatContextType = "document" | "data-change" | "onboarding-case";

export interface ChatContext {
  type: ChatContextType;
  id: string;
  /** Stored on the message so the chip still reads correctly if the target goes. */
  label: string;
}

export interface ChatMessage {
  id: string;
  relationshipId: string;
  authorSide: ChatAuthorSide;
  /** Denormalised at insert time: a message records who said it *then*. */
  authorName: string;
  authorCompany: string;
  authorRole?: string;
  body: string;
  context?: ChatContext;
  createdAt: string;
  /** True once the author is no longer active — rendered as "(inactive)". */
  authorInactive?: boolean;
}

/** Per-side read marker. Unread = the other side's messages after `lastReadAt`. */
export interface ChatRead {
  relationshipId: string;
  side: ChatSide;
  lastReadAt: string;
  notifiedAt?: string;
}
