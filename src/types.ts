export type Criticality = "critical" | "high" | "medium" | "low";

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
}

export type SupplierStage = "Prospect" | "Supplier" | "Provider";

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
}

export type DocStatus =
  | "valid"
  | "warning-60"
  | "warning-30"
  | "pending-review"
  | "rejected-resubmit"
  | "blocked";

export interface ComplianceEvent {
  date: string;
  event: string;
  actor: string;
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
  history: ComplianceEvent[];
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

export type OnboardingStatus = "Stale" | "Pending" | "Opened";

export interface OnboardingCase {
  id: string;
  companyName: string;
  contactName: string;
  status: OnboardingStatus;
  daysNoResponse: number;
  criticality: Criticality;
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
