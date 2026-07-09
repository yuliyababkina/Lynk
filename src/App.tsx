import { useState } from "react";
import { Sidebar } from "@/components/yarowa/sidebar";
import { TicketDrawer } from "@/components/yarowa/ticket-drawer";
import { ComplianceDrawer } from "@/components/yarowa/compliance-drawer";
import { DocumentLightbox } from "@/components/yarowa/document-lightbox";
import { Toaster, toast } from "@/components/yarowa/toast";
import { actionResult } from "@/lib/ticket-actions";
import { TICKETS } from "./data";
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
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [activeDoc, setActiveDoc] = useState<SupplierDoc | null>(null);
  const [reviewDoc, setReviewDoc] = useState<SupplierDoc | null>(null);

  function navigate(v: View, selectedId?: string) {
    setActiveTicket(null);
    setActiveDoc(null);
    setPendingSelected(selectedId ?? null);
    setView(v);
  }

  function resolveTicket(ticket: Ticket, action: string) {
    setResolvedIds((prev) => new Set(prev).add(ticket.id));
    setActiveTicket((cur) => (cur?.id === ticket.id ? null : cur));
    const result = actionResult(action);
    toast({
      title: result.title,
      description: `${ticket.entityName} · ${ticket.title}`,
      tone: result.tone,
      action: {
        label: "Undo",
        onClick: () =>
          setResolvedIds((prev) => {
            const next = new Set(prev);
            next.delete(ticket.id);
            return next;
          }),
      },
    });
  }

  // A renewal decision is the same act no matter where it was triggered from, so
  // it clears the lightbox, closes the compliance drawer, and resolves the linked
  // dashboard ticket — keeping the ticket consistent across every space.
  function decideRenewal(doc: SupplierDoc, decision: "accept" | "reject") {
    if (decision === "accept") {
      toast({
        title: "Renewal accepted",
        description:
          doc.status === "blocked"
            ? `${doc.supplierName} reactivated for work orders.`
            : `New version of ${doc.documentName} is now active.`,
        tone: "success",
      });
    } else {
      toast({
        title: "Renewal rejected",
        description: `${doc.supplierName} asked to re-upload ${doc.documentName}.`,
        tone: "warning",
      });
    }
    setReviewDoc(null);
    setActiveDoc(null);
    const linked = TICKETS.find((t) => t.source === "compliance-monitoring" && t.targetId === doc.id);
    if (linked) {
      setResolvedIds((prev) => new Set(prev).add(linked.id));
      setActiveTicket((cur) => (cur?.id === linked.id ? null : cur));
    }
  }

  function openProfile(id: string) {
    setSelectedSupplierId(id);
    setView("supplier-profile");
  }

  function selectTicket(t: Ticket) {
    setActiveDoc(null);
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
            {view === "dashboard" && (
              <Dashboard
                onSelectTicket={selectTicket}
                resolvedIds={resolvedIds}
                onResolve={resolveTicket}
              />
            )}
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
                onSelectDoc={(doc: SupplierDoc) => {
                  setActiveTicket(null);
                  setActiveDoc(doc);
                }}
                selectedDocId={activeDoc?.id ?? pendingSelected}
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

          {activeDoc ? (
            <ComplianceDrawer doc={activeDoc} onClose={() => setActiveDoc(null)} onReview={setReviewDoc} />
          ) : activeTicket ? (
            <TicketDrawer
              ticket={activeTicket}
              onClose={() => setActiveTicket(null)}
              onNavigate={navigate}
              onResolve={resolveTicket}
              onReview={setReviewDoc}
            />
          ) : null}
        </div>
      </div>

      {reviewDoc && (
        <DocumentLightbox
          doc={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onDecision={(decision) => decideRenewal(reviewDoc, decision)}
        />
      )}

      <Toaster />
    </div>
  );
}
