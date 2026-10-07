import { useCallback, useEffect, useState } from "react";
import { PortalSidebar } from "@/components/yarowa/portal-sidebar";
import { Toaster } from "@/components/yarowa/toast";
import { TopHeader } from "@/components/yarowa/top-header";
import { PortalOverview } from "./portal/Overview";
import { PortalPrincipals } from "./portal/Principals";
import { PortalDocuments } from "./portal/Documents";
import { PortalRequestedUpdates } from "./portal/RequestedUpdates";
import { PortalCompanyDetails } from "./portal/CompanyDetails";
import { PortalPriceAgreements } from "./portal/PriceAgreements";
import { PortalOnboarding } from "./portal/Onboarding";
import {
  PortalActivityDrawer,
  type ActivityOutcome,
  type ChangeRecord,
  type PortalActivitySelection,
} from "@/components/yarowa/portal-activity-drawer";
import { getPortalProfile, type CompanyDetails, type OverviewGroup } from "./portal/portal-data";

export type PortalView =
  | "overview"
  | "principals"
  | "documents"
  | "requested-updates"
  | "price-agreements"
  | "company-details"
  | "onboarding";

export interface PortalProps {
  supplierName: string;
  supplierId: string;
  onSwitchAccount?: () => void;
}

const VIEW_LABEL: Record<PortalView, string> = {
  overview: "Overview",
  principals: "Principals",
  documents: "Documents",
  "requested-updates": "Requested Updates",
  "price-agreements": "Price Agreements",
  "company-details": "Company Details",
  onboarding: "Onboarding",
};

export function SupplierPortal({ supplierName, supplierId, onSwitchAccount }: PortalProps) {
  const [view, setView] = useState<PortalView>("overview");
  const [activity, setActivity] = useState<PortalActivitySelection | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* Tickets and profile edits live here for the length of the session, the same
     way the rest of the portal holds its state — so fixing something from the
     Overview panel is visible straight away, without a round trip. Switching
     persona starts from that persona's own data again. */
  const [groups, setGroups] = useState<OverviewGroup[]>(() => getPortalProfile(supplierId).overviewGroups);
  const [company, setCompany] = useState<CompanyDetails>(() => getPortalProfile(supplierId).company);
  /* What was sent for endorsement, kept so a Pending Approval item can show the
     before/after instead of only saying that something is being reviewed. */
  const [changeRequests, setChangeRequests] = useState<Record<string, ChangeRecord[]>>({});

  useEffect(() => {
    const profile = getPortalProfile(supplierId);
    setGroups(profile.overviewGroups);
    setCompany(profile.company);
    setChangeRequests({});
    setActivity(null);
  }, [supplierId]);

  /* Moves a finished ticket out of its group and into the one that now describes
     it — Pending Approval while someone else reviews it, Resolved when the
     supplier's own action was the last word. */
  const itemDone = useCallback((itemId: string, outcome: ActivityOutcome, changes?: ChangeRecord[]) => {
    if (changes?.length) setChangeRequests((prev) => ({ ...prev, [itemId]: changes }));
    setGroups((prev) => {
      const found = prev.flatMap((g) => g.items).find((i) => i.id === itemId);
      if (!found) return prev;
      /* The actions travel with the state. Once something is with the principal
         there is nothing left to upload — offering it again would invite the
         supplier to submit the same file twice. */
      const moved = {
        ...found,
        actions: outcome === "pending-approval" ? ["Remind"] : ["Review"],
      };
      return prev.map((g) => {
        const without = g.items.filter((i) => i.id !== itemId);
        if (g.key === outcome) {
          const items = [moved, ...without];
          return { ...g, items, count: items.length };
        }
        return { ...g, items: without, count: without.length };
      });
    });
  }, []);

  // Switching views closes any open detail drawer.
  const navigate = (v: PortalView) => {
    setActivity(null);
    setView(v);
  };

  const supplierInitials = supplierName
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <PortalSidebar
        view={view}
        onNavigate={navigate}
        supplierId={supplierId}
        collapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen((open) => !open)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-sidebar">
        <TopHeader
          currentLabel={VIEW_LABEL[view]}
          onSwitchAccount={onSwitchAccount}
          accountInitials={supplierInitials || "SP"}
        />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto min-w-0 bg-sidebar">
            {view === "overview" && (
              <PortalOverview
                supplierId={supplierId}
                groups={groups}
                onNavigate={navigate}
                onOpenActivity={setActivity}
              />
            )}
            {view === "principals" && <PortalPrincipals supplierId={supplierId} />}
            {view === "documents" && <PortalDocuments supplierId={supplierId} />}
            {view === "requested-updates" && <PortalRequestedUpdates supplierId={supplierId} />}
            {view === "price-agreements" && <PortalPriceAgreements supplierId={supplierId} />}
            {view === "company-details" && (
              <PortalCompanyDetails supplierId={supplierId} company={company} />
            )}
            {view === "onboarding" && <PortalOnboarding supplierId={supplierId} />}
          </main>
          {activity && (
            <PortalActivityDrawer
              /* Remount per ticket: the panel holds a picked file and edited
                 field values, and neither should survive opening another one. */
              key={activity.item?.id ?? activity.quick ?? "panel"}
              selection={activity}
              supplierId={supplierId}
              supplierName={company.legalName}
              company={company}
              onClose={() => setActivity(null)}
              onCompanyChange={setCompany}
              onItemDone={itemDone}
              changeRequests={changeRequests}
            />
          )}
        </div>
      </div>

      {/* The portal is rendered instead of the PM shell, not inside it, so it
          needs its own toast surface — otherwise confirmations go nowhere. */}
      <Toaster />
    </div>
  );
}
