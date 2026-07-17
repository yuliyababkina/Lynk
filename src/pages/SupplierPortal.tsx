import { useState } from "react";
import { PortalSidebar } from "@/components/yarowa/portal-sidebar";
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
  type PortalActivitySelection,
} from "@/components/yarowa/portal-activity-drawer";

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
              <PortalOverview supplierId={supplierId} onNavigate={navigate} onOpenActivity={setActivity} />
            )}
            {view === "principals" && <PortalPrincipals supplierId={supplierId} />}
            {view === "documents" && <PortalDocuments supplierId={supplierId} />}
            {view === "requested-updates" && <PortalRequestedUpdates supplierId={supplierId} />}
            {view === "price-agreements" && <PortalPriceAgreements supplierId={supplierId} />}
            {view === "company-details" && <PortalCompanyDetails supplierId={supplierId} />}
            {view === "onboarding" && <PortalOnboarding supplierId={supplierId} />}
          </main>
          {activity && <PortalActivityDrawer selection={activity} onClose={() => setActivity(null)} />}
        </div>
      </div>
    </div>
  );
}
