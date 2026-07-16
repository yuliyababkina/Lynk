import type { Supplier, Ticket, SupplierDoc, Contract, DataGovernanceRequest, OnboardingCase, Catalogue, CatalogueSupplier, Principal, SupplierPrincipalRelationship, DirectoryCompany, CatalogueLineDiff } from "./types";

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

export const TRADES = [
  "Carpentry",
  "Drywall",
  "Electrical",
  "Heating & Plumbing",
  "Landscaping",
  "Renovation",
  "Roofing",
];

// Company typeahead used in the invite wizard. Matching a name here switches the
// flow: "on-lynk" → connection request (no email), "connected" → already yours.
// Any other typed name is treated as a brand-new company (email invite).
export const COMPANY_DIRECTORY: DirectoryCompany[] = [
  { name: "Arctis Build Systems", trade: "Roofing", city: "Munich", rating: 88, state: "on-lynk" },
  { name: "Brandt Electrical", trade: "Electrical", city: "Stuttgart", rating: 76, state: "on-lynk" },
  { name: "DeltaHaus Roofing GmbH", trade: "Roofing", city: "Munich", rating: 62, state: "connected" },
  { name: "Fixora Heating", trade: "Heating & Plumbing", city: "Berlin", state: "new" },
  { name: "Gipfelmontage Drywall", trade: "Drywall", city: "Munich", state: "new" },
];

export const CATALOGUE_REGIONS = ["Bavaria", "Baden-Württemberg", "NRW", "Hesse", "Berlin", "All Germany"];
export const CATALOGUE_TRADES = ["Painting", "Roofing", "Piping", "Electrical", "Sanitary"];

export const PARSED_LINES: CatalogueLineDiff[] = [
  { id: "np-1", service: "Interior wall painting", category: "Interior", unit: "m²", rate: 13.2, change: "unchanged" },
  { id: "np-2", service: "Ceiling painting", category: "Interior", unit: "m²", rate: 14.8, change: "unchanged" },
  { id: "np-3", service: "Facade painting", category: "Exterior", unit: "m²", rate: 24.5, change: "unchanged" },
  { id: "np-4", service: "Primer application", category: "Preparation", unit: "m²", rate: 6.9, change: "unchanged" },
  { id: "np-5", service: "Wallpaper removal", category: "Preparation", unit: "m²", rate: 9.4, change: "unchanged" },
  { id: "np-6", service: "Lacquer work, doors", category: "Detail work", unit: "piece", rate: 89.0, change: "unchanged" },
  { id: "np-7", service: "Scaffolding setup", category: "Site setup", unit: "day", rate: 250.0, change: "unchanged" },
  { id: "np-8", service: "Travel surcharge", category: "Surcharges", unit: "flat", rate: 48.0, change: "unchanged" },
  { id: "np-9", service: "Mold treatment", category: "Preparation", unit: "m²", rate: 18.5, change: "unchanged" },
  { id: "np-10", service: "Spray painting, radiators", category: "Detail work", unit: "piece", rate: 65.0, change: "unchanged" },
];

// Mock diff against the current active version (update flow preview).
export const DIFF_LINES: CatalogueLineDiff[] = [
  { id: "df-1", service: "Interior wall painting", category: "Interior", unit: "m²", rate: 13.2, change: "changed", previousRate: 12.5 },
  { id: "df-2", service: "Ceiling painting", category: "Interior", unit: "m²", rate: 14.0, change: "unchanged" },
  { id: "df-3", service: "Facade painting", category: "Exterior", unit: "m²", rate: 24.5, change: "changed", previousRate: 22.8 },
  { id: "df-4", service: "Primer application", category: "Preparation", unit: "m²", rate: 6.4, change: "unchanged" },
  { id: "df-5", service: "Wallpaper removal", category: "Preparation", unit: "m²", rate: 8.9, change: "unchanged" },
  { id: "df-6", service: "Lacquer work, doors", category: "Detail work", unit: "piece", rate: 89.0, change: "changed", previousRate: 85.0 },
  { id: "df-7", service: "Scaffolding setup", category: "Site setup", unit: "day", rate: 240.0, change: "removed" },
  { id: "df-8", service: "Travel surcharge", category: "Surcharges", unit: "flat", rate: 45.0, change: "unchanged" },
  { id: "df-9", service: "Mold treatment", category: "Preparation", unit: "m²", rate: 18.5, change: "added" },
  { id: "df-10", service: "Spray painting, radiators", category: "Detail work", unit: "piece", rate: 65.0, change: "added" },
];
