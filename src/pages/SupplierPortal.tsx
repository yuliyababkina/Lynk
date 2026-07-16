import { useState } from "react";
import { PortalSidebar } from "@/components/yarowa/portal-sidebar";
import { PortalOverview } from "./portal/Overview";
import { PortalPrincipals } from "./portal/Principals";
import { PortalDocuments } from "./portal/Documents";
import { PortalRequestedUpdates } from "./portal/RequestedUpdates";
import { PortalCompanyDetails } from "./portal/CompanyDetails";
import { PortalOnboarding } from "./portal/Onboarding";

export type PortalView =
  | "overview"
  | "principals"
  | "documents"
  | "requested-updates"
  | "company-details"
  | "onboarding";

export interface PortalProps {
  supplierName: string;
  supplierId: string;
}

export function SupplierPortal({ supplierName, supplierId }: PortalProps) {
  const [view, setView] = useState<PortalView>("overview");

  const getViewLabel = (): string => {
    const labels: Record<PortalView, string> = {
      overview: "Overview",
      principals: "Principals",
      documents: "Documents",
      "requested-updates": "Requested Updates",
      "company-details": "Company Details",
      onboarding: "Onboarding",
    };
    return labels[view];
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <PortalSidebar view={view} onNavigate={setView} supplierName={supplierName} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-card">
          <span className="text-sm font-medium text-muted-foreground">
            Lynk / Supplier Portal / <span className="text-foreground">{getViewLabel()}</span>
          </span>
          <div className="flex-1" />
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
            {supplierName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {view === "overview" && <PortalOverview supplierId={supplierId} />}
          {view === "principals" && <PortalPrincipals supplierId={supplierId} />}
          {view === "documents" && <PortalDocuments supplierId={supplierId} />}
          {view === "requested-updates" && <PortalRequestedUpdates supplierId={supplierId} />}
          {view === "company-details" && <PortalCompanyDetails supplierId={supplierId} />}
          {view === "onboarding" && <PortalOnboarding supplierId={supplierId} />}
        </main>
      </div>
    </div>
  );
}
