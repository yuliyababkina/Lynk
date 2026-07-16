import type { Supplier, Ticket, SupplierDoc, Contract, DataGovernanceRequest, OnboardingCase, Catalogue, CatalogueSupplier, Principal, SupplierPrincipalRelationship } from "./types";

export const PRINCIPALS: Principal[] = [
  { id: "principal_wincasa", name: "Wincasa", associatesCount: 3 },
  { id: "principal_gch", name: "GCH", associatesCount: 2 },
  { id: "principal_at_immobilien", name: "AT Immobilien", associatesCount: 4 },
];

// Martin Weber (Active Supplier - EuroBau Components)
export const SUPPLIER_RELATIONSHIPS_MARTIN: SupplierPrincipalRelationship[] = [
  {
    id: "rel_martin_wincasa",
    supplierProfileId: "supplier_martin_weber",
    principalId: "principal_wincasa",
    principalName: "Wincasa",
    status: "supplier",
    unreadCount: 2,
    pendingCount: 1,
    rejectedCount: 0,
    lastMessage: { from: "Wincasa", text: "Please update your insurance certificate", at: "2 days ago" },
  },
  {
    id: "rel_martin_gch",
    supplierProfileId: "supplier_martin_weber",
    principalId: "principal_gch",
    principalName: "GCH",
    status: "supplier",
    unreadCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    lastMessage: { from: "You", text: "All documents confirmed", at: "1 week ago" },
  },
  {
    id: "rel_martin_at",
    supplierProfileId: "supplier_martin_weber",
    principalId: "principal_at_immobilien",
    principalName: "AT Immobilien",
    status: "prospect",
    unreadCount: 1,
    pendingCount: 3,
    rejectedCount: 0,
    lastMessage: { from: "AT Immobilien", text: "Please complete your onboarding", at: "3 days ago" },
  },
];

// Mehmet Yilmaz (Prospect - Yilmaz Elektrotechnik)
export const SUPPLIER_RELATIONSHIPS_MEHMET: SupplierPrincipalRelationship[] = [
  {
    id: "rel_mehmet_wincasa",
    supplierProfileId: "supplier_mehmet_yilmaz",
    principalId: "principal_wincasa",
    principalName: "Wincasa",
    status: "prospect",
    unreadCount: 0,
    pendingCount: 4,
    rejectedCount: 1,
    lastMessage: { from: "Wincasa", text: "Changes requested to your company details", at: "2 days ago" },
  },
];

export const SUPPLIERS: Supplier[] = [
  {
    id: "supplier_1",
    name: "Acme Corporation",
    stage: "supplier",
    relationshipId: "rel_1",
    trade: "Manufacturing",
    region: "EU",
    compliance: "Fully Compliant",
    rating: 4.2,
    openTickets: 3,
    contacts: [
      { name: "John Smith", role: "Procurement Lead", email: "john@acme.com", phone: "+1-555-0100", primary: true },
    ],
    regionsServed: ["EU", "UK"],
    capabilities: ["Manufacturing", "Assembly"],
    vatId: "DE123456789",
    address: "123 Industrial St, Berlin",
    lastActive: "2 hours ago",
  },
  // ... rest of suppliers
];

export const TICKETS: Ticket[] = [
  {
    id: "ticket_1",
    title: "Insurance Certificate Expired",
    criticality: "critical",
    entityName: "EuroBau Components",
    entityType: "Supplier",
    ageLabel: "2 days",
    primaryAction: "Request Renewal",
    source: "compliance-monitoring",
    category: "Document compliance",
    status: "To do",
  },
  // ... more tickets
];

export const DOCS: SupplierDoc[] = [
  {
    id: "doc_1",
    supplierId: "supplier_1",
    supplierName: "Acme Corporation",
    trade: "Manufacturing",
    documentName: "Certificate of Incorporation",
    documentCategory: "Legal",
    expiryDate: "2026-12-31",
    daysUntilExpiry: 534,
    status: "valid",
    history: [],
  },
  // ... more docs
];

export const CONTRACTS: Contract[] = [];
export const DATA_GOVERNANCE_REQUESTS: DataGovernanceRequest[] = [];
export const ONBOARDING_CASES: OnboardingCase[] = [];
export const CATALOGUES: Catalogue[] = [];
