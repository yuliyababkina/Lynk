import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TicketDrawer } from "./components/TicketDrawer";
import { Dashboard } from "./pages/Dashboard";
import { SuppliersOverview } from "./pages/SuppliersOverview";
import { SupplierProfile } from "./pages/SupplierProfile";
import { ComplianceMonitoring } from "./pages/ComplianceMonitoring";
import { ContractManagement } from "./pages/ContractManagement";
import { DataGovernance } from "./pages/DataGovernance";
import { Onboarding } from "./pages/Onboarding";
import { ServiceCatalogue } from "./pages/ServiceCatalogue";
import { Reporting } from "./pages/Reporting";
import type { Ticket, SupplierDoc, Contract } from "./types";

export type View =
  | "dashboard"
  | "suppliers"
  | "supplier-profile"
  | "data-governance"
  | "onboarding"
  | "compliance"
  | "contracts"
  | "reporting"
  | "service-catalogue";

const VIEW_LABEL: Record<View, string> = {
  dashboard: "Dashboard",
  suppliers: "Suppliers Overview",
  "supplier-profile": "Supplier Profile",
  "data-governance": "Data Governance",
  onboarding: "Onboarding",
  compliance: "Compliance Monitoring",
  contracts: "Contract Management",
  reporting: "Reporting",
  "service-catalogue": "Service Catalogue",
};

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [pendingSelected, setPendingSelected] = useState<string | null>(null);

  function navigate(v: View, selectedId?: string) {
    setActiveTicket(null);
    setPendingSelected(selectedId ?? null);
    setView(v);
  }

  function openProfile(id: string) {
    setSelectedSupplierId(id);
    setView("supplier-profile");
  }

  function selectTicket(t: Ticket) {
    setActiveTicket(t);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar view={view} onNavigate={(v) => navigate(v)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-card">
          <span className="text-sm font-medium text-muted-foreground">
            Lynk / Procurement Platform / <span className="text-foreground">{VIEW_LABEL[view]}</span>
          </span>
          <div className="flex-1" />
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
            SM
          </div>
        </header>

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto min-w-0">
            {view === "dashboard" && <Dashboard onSelectTicket={selectTicket} />}
            {view === "suppliers" && (
              <SuppliersOverview onOpenProfile={openProfile} initialSelectedId={pendingSelected} />
            )}
            {view === "supplier-profile" && selectedSupplierId && (
              <SupplierProfile
                supplierId={selectedSupplierId}
                onBack={() => setView("suppliers")}
                onSelectTicket={selectTicket}
              />
            )}
            {view === "data-governance" && <DataGovernance initialSelectedId={pendingSelected} />}
            {view === "onboarding" && <Onboarding initialSelectedId={pendingSelected} />}
            {view === "compliance" && (
              <ComplianceMonitoring
                onSelectDoc={(doc: SupplierDoc) =>
                  selectTicket({
                    id: `doc-${doc.id}`,
                    title: `${doc.documentName} — ${doc.supplierName}`,
                    criticality: doc.status === "blocked" ? "critical" : "medium",
                    entityName: doc.supplierName,
                    entityType: "Supplier",
                    ageLabel: doc.expiryDate,
                    primaryAction: "Review",
                    source: "compliance-monitoring",
                    category: "Document compliance",
                    targetId: doc.id,
                  })
                }
                initialSelectedId={pendingSelected}
              />
            )}
            {view === "contracts" && (
              <ContractManagement
                onSelectContract={(c: Contract) =>
                  selectTicket({
                    id: `contract-${c.id}`,
                    title: `${c.ref} — ${c.supplierName}`,
                    criticality: c.status === "Renewal Urgent" ? "critical" : "medium",
                    entityName: c.supplierName,
                    entityType: "Supplier",
                    ageLabel: c.timeLeftLabel,
                    primaryAction: "Renew",
                    source: "contracts",
                    category: "Contracts",
                    targetId: c.id,
                  })
                }
                initialSelectedId={pendingSelected}
              />
            )}
            {view === "reporting" && <Reporting />}
            {view === "service-catalogue" && <ServiceCatalogue initialSelectedId={pendingSelected} />}
          </main>

          {activeTicket && (
            <TicketDrawer ticket={activeTicket} onClose={() => setActiveTicket(null)} onNavigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
}
