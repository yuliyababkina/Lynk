import { useState, useEffect, lazy, Suspense } from "react";
import { Sidebar } from "@/components/yarowa/sidebar";
import { TopHeader } from "@/components/yarowa/top-header";
import { TicketDrawer } from "@/components/yarowa/ticket-drawer";
import { ComplianceDrawer } from "@/components/yarowa/compliance-drawer";
import { DocumentLightbox } from "@/components/yarowa/document-lightbox";
import { Toaster, toast } from "@/components/yarowa/toast";
import { actionResult } from "@/lib/ticket-actions";
import { onboardingSupplierId } from "@/lib/db";
import { useLynkData } from "./lib/LynkDataContext";
import { Landing } from "./pages/Landing";
import type { Ticket, SupplierDoc, Contract } from "./types";
import type { LandingRole } from "./pages/Landing";

// Route-level code splitting: each view/portal loads its own chunk on demand,
// keeping the initial bundle to the landing page + shell. Landing stays eager
// (it's the entry screen). Named exports are mapped to `default` for lazy().
const SupplierPortal = lazy(() => import("./pages/SupplierPortal").then((m) => ({ default: m.SupplierPortal })));
const ProspectOnboarding = lazy(() => import("./pages/ProspectOnboarding").then((m) => ({ default: m.ProspectOnboarding })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const SuppliersOverview = lazy(() => import("./pages/SuppliersOverview").then((m) => ({ default: m.SuppliersOverview })));
const SupplierProfile = lazy(() => import("./pages/SupplierProfile").then((m) => ({ default: m.SupplierProfile })));
const ComplianceMonitoring = lazy(() => import("./pages/ComplianceMonitoring").then((m) => ({ default: m.ComplianceMonitoring })));
const ContractManagement = lazy(() => import("./pages/ContractManagement").then((m) => ({ default: m.ContractManagement })));
const DataGovernance = lazy(() => import("./pages/DataGovernance").then((m) => ({ default: m.DataGovernance })));
const Onboarding = lazy(() => import("./pages/Onboarding").then((m) => ({ default: m.Onboarding })));
const ServiceCatalogue = lazy(() => import("./pages/ServiceCatalogue").then((m) => ({ default: m.ServiceCatalogue })));
const Reporting = lazy(() => import("./pages/Reporting").then((m) => ({ default: m.Reporting })));
// Large (~558 lines) and only opened behind a button — split it out too.
const InviteSupplierModal = lazy(() =>
  import("@/components/yarowa/invite-supplier-modal").then((m) => ({ default: m.InviteSupplierModal }))
);

// Lightweight fallback shown while a view chunk is fetched.
function ViewFallback() {
  return <div className="flex-1" aria-busy="true" />;
}

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

  // Real magic-link invitations land here as ?invite=<token>. Once the
  // onboarding cases are loaded we resolve the token to a specific prospect
  // (see the effect below) instead of falling back to the fixed demo persona.
  // `undefined` = no token in the URL, `null` = token present but not found
  // (invalid/expired link), object = resolved successfully.
  const [inviteProspect, setInviteProspect] = useState<
    { id: string; companyName: string; contactName?: string } | null | undefined
  >(
    undefined
  );

  const {
    tickets: TICKETS,
    docs: DOCS,
    suppliers: SUPPLIERS,
    onboardingCases: ONBOARDING_CASES,
    resolvedTicketIds,
    resolveTicket: persistResolveTicket,
    unresolveTicket,
    decideRenewal: persistDecideRenewal,
    addOnboardingCase,
  } = useLynkData();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (!token) {
      setInviteProspect(undefined);
      return;
    }
    const match = ONBOARDING_CASES.find((c) => c.inviteToken === token);
    if (match) {
      setInviteProspect({
        id: onboardingSupplierId(match.id),
        companyName: match.companyName,
        contactName: match.contactName,
      });
      setRole("prospect");
    } else {
      setInviteProspect(null);
    }
  }, [ONBOARDING_CASES]);

  const [view, setView] = useState<View>("dashboard");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [pendingSelected, setPendingSelected] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<SupplierDoc | null>(null);
  const [reviewDoc, setReviewDoc] = useState<SupplierDoc | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const unresolvedTickets = TICKETS.filter(
    (ticket) => !resolvedTicketIds.has(ticket.id) && ticket.status !== "Resolved" && !ticket.resolved
  );

  const sidebarBadgeCounts: Partial<Record<View, number>> = {
    "data-governance": unresolvedTickets.filter(
      (ticket) => ticket.source === "data-governance" || ticket.source === "data-quality"
    ).length,
    onboarding: unresolvedTickets.filter(
      (ticket) => ticket.source === "onboarding" || ticket.source === "prospect"
    ).length,
    compliance: unresolvedTickets.filter((ticket) => ticket.source === "compliance-monitoring").length,
    contracts: unresolvedTickets.filter((ticket) => ticket.source === "contracts").length,
  };

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

  // A magic-link click carried a token that doesn't match any prospect
  // (expired, already used, or mistyped) — say so instead of silently
  // dropping them on the generic landing/role picker.
  if (inviteProspect === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-sm">
          <div className="font-semibold mb-1">This invitation link isn't valid</div>
          <div className="text-sm text-muted-foreground">
            It may have expired or already been used. Contact the company that invited you for a new link.
          </div>
        </div>
      </div>
    );
  }

  // Show landing page if no role selected
  if (!role) {
    return <Landing onSelectRole={handleSelectRole} />;
  }

  // Render Supplier Portal for supplier/prospect roles
  if (role === "supplier") {
    return (
      <Suspense fallback={<ViewFallback />}>
        <SupplierPortal
          supplierName="Martin Weber"
          supplierId="supplier_martin_weber"
          onSwitchAccount={handleSwitchAccount}
        />
      </Suspense>
    );
  }

  // Prospects go through the onboarding wizard (fill profile + upload docs +
  // submit for review) rather than the full supplier portal.
  if (role === "prospect") {
    return (
      <Suspense fallback={<ViewFallback />}>
        <ProspectOnboarding
          supplierName={inviteProspect?.companyName ?? "Yilmaz Elektrotechnik GmbH"}
          supplierId={inviteProspect?.id ?? "supplier_mehmet_yilmaz"}
          contactName={inviteProspect?.contactName}
          onSwitchAccount={handleSwitchAccount}
        />
      </Suspense>
    );
  }

  // Render PM app for PM role
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        view={view}
        onNavigate={(v) => navigate(v)}
        onInvite={() => setInviteOpen(true)}
        badgeCounts={sidebarBadgeCounts}
        collapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen((open) => !open)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-sidebar">
        <TopHeader currentLabel={VIEW_LABEL[view]} onSwitchAccount={handleSwitchAccount} accountInitials="SM" />

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto min-w-0">
            <Suspense fallback={<ViewFallback />}>
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
            </Suspense>
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

      {inviteOpen && (
        <Suspense fallback={null}>
          <InviteSupplierModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onCreateProspect={(c) => addOnboardingCase(c)}
          />
        </Suspense>
      )}

      <Toaster />
    </div>
  );
}
