import { useState } from "react";
import { Sidebar } from "@/components/yarowa/sidebar";
import { TicketDrawer } from "@/components/yarowa/ticket-drawer";
import { ComplianceDrawer } from "@/components/yarowa/compliance-drawer";
import { DocumentLightbox } from "@/components/yarowa/document-lightbox";
import { InviteSupplierModal } from "@/components/yarowa/invite-supplier-modal";
import { Toaster, toast } from "@/components/yarowa/toast";
import { actionResult } from "@/lib/ticket-actions";
import { useLynkData } from "./lib/LynkDataContext";
import { Landing } from "./pages/Landing";
import { SupplierPortal } from "./pages/SupplierPortal";
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
import type { LandingRole } from "./pages/Landing";

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
  // Role/persona switcher
  const [role, setRole] = useState<LandingRole | null>(null);
  
  const {
    tickets: TICKETS,
    docs: DOCS,
    suppliers: SUPPLIERS,
    resolvedTicketIds,
    resolveTicket: persistResolveTicket,
    unresolveTicket,
    decideRenewal: persistDecideRenewal,
    addOnboardingCase,
  } = useLynkData();

  const [view, setView] = useState<View>("dashboard");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [pendingSelected, setPendingSelected] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<SupplierDoc | null>(null);
  const [reviewDoc, setReviewDoc] = useState<SupplierDoc | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Handle role selection from landing page
  function handleSelectRole(selectedRole: LandingRole) {
    setRole(selectedRole);
  }

  // Switch back to landing (role switcher)
  function handleSwitchAccount() {
    setRole(null);
  }

  function navigate(v: View, selectedId?: string) {
    setActiveTicket(null);
    // Opening a ticket in Compliance Monitoring should surface the linked
    // document's drawer, not merely highlight its row.
    const doc = v === "compliance" && selectedId ? DOCS.find((d) => d.id === selectedId) : undefined;
    setActiveDoc(doc ?? null);
    setPendingSelected(selectedId ?? null);
    setView(v);
  }

  // resolvedIds keeps the same name/shape the pages already expect; it's now
  // backed by the DB (via LynkDataContext) instead of local-only state, so a
  // resolved ticket stays resolved across reloads and browser sessions.
  const resolvedIds = resolvedTicketIds;

  function resolveTicket(ticket: Ticket, action: string) {
    persistResolveTicket(ticket, action);
    setActiveTicket((cur) => (cur?.id === ticket.id ? null : cur));
    const result = actionResult(action);
    toast({
      title: result.title,
      description: `${ticket.entityName} · ${ticket.title}`,
      tone: result.tone,
      action: {
        label: "Undo",
        onClick: () => unresolveTicket(ticket.id),
      },
    });
  }

  // A renewal decision is the same act no matter where it was triggered from, so
  // it clears the lightbox, closes the compliance drawer, and resolves the linked
  // dashboard ticket — keeping the ticket consistent across every space. The
  // actual document status change and ticket resolution are persisted via
  // LynkDataContext (decideRenewal / resolveTicket), so they survive a reload.
  function decideRenewal(doc: SupplierDoc, decision: "accept" | "reject") {
    persistDecideRenewal(doc, decision);
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
      persistResolveTicket(linked, decision === "accept" ? "Review" : "Escalate");
      setActiveTicket((cur) => (cur?.id === linked.id ? null : cur));
    }
  }

  function openProfile(id: string) {
    setActiveTicket(null);
    setActiveDoc(null);
    setSelectedSupplierId(id);
    setView("supplier-profile");
  }

  // Tickets reference a supplier by display name; resolve it to the profile.
  function openSupplierByName(name: string) {
    const match = SUPPLIERS.find((s) => s.name === name);
    if (match) openProfile(match.id);
    else navigate("suppliers");
  }

  function selectTicket(t: Ticket) {
    setActiveDoc(null);
    setActiveTicket(t);
  }

  // Show landing page if no role selected
  if (!role) {
    return <Landing onSelectRole={handleSelectRole} />;
  }

  // Render Supplier Portal for supplier/prospect roles
  if (role === "supplier") {
    return (
      <SupplierPortal
        supplierName="Martin Weber"
        supplierId="supplier_martin_weber"
        onSwitchAccount={handleSwitchAccount}
      />
    );
  }

  if (role === "prospect") {
    return (
      <SupplierPortal
        supplierName="Mehmet Yilmaz"
        supplierId="supplier_mehmet_yilmaz"
        onSwitchAccount={handleSwitchAccount}
      />
    );
  }

  // Render PM app for PM role
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar view={view} onNavigate={(v) => navigate(v)} onInvite={() => setInviteOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-card">
          <span className="text-sm font-medium text-muted-foreground">
            Lynk / Procurement Platform / <span className="text-foreground">{VIEW_LABEL[view]}</span>
          </span>
          <div className="flex-1" />
          <button
            onClick={handleSwitchAccount}
            className="mr-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Switch account"
          >
            Switch
          </button>
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center cursor-pointer hover:opacity-80"
            onClick={handleSwitchAccount}
            title="Switch account">
            SM
          </div>
        </header>

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto min-w-0">
            {view === "dashboard" && (
              <Dashboard
                onSelectTicket={selectTicket}
                onOpenSupplier={openSupplierByName}
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
              onOpenSupplier={openSupplierByName}
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

      <InviteSupplierModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreateProspect={(c) => addOnboardingCase(c)}
      />

      <Toaster />
    </div>
  );
}
