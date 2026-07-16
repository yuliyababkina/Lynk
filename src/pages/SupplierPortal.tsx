import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalSidebar } from "@/components/yarowa/portal-sidebar";
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

export function SupplierPortal({ supplierId, onSwitchAccount }: PortalProps) {
  const [view, setView] = useState<PortalView>("overview");
  const [activity, setActivity] = useState<PortalActivitySelection | null>(null);

  // Switching views closes any open detail drawer.
  const navigate = (v: PortalView) => {
    setActivity(null);
    setView(v);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Dark top bar */}
      <header className="h-12 shrink-0 bg-brand-navy text-white flex items-center px-4 gap-3">
        <PanelLeft className="w-4 h-4 text-white/50" />
        <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
          L
        </div>
        <span className="text-sm font-semibold">Lynk</span>
        <span className="text-sm text-white/40">/ Procurement Platform</span>
        <span className="text-sm text-white/40">/</span>
        <span className="text-sm text-white/90">{VIEW_LABEL[view]}</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onSwitchAccount}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          Switch account
        </Button>
      </header>

      {/* Sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <PortalSidebar view={view} onNavigate={navigate} supplierId={supplierId} />
        <main className="flex-1 overflow-y-auto min-w-0">
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
  );
}
