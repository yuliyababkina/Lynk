import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PortalView } from "@/pages/SupplierPortal";
import { getPortalProfile, initialsOf } from "@/pages/portal/portal-data";
import { LayoutDashboard, AlertCircle, FileText, ReceiptText, Building, Users } from "lucide-react";

export interface PortalSidebarProps {
  view: PortalView;
  onNavigate: (view: PortalView) => void;
  supplierId: string;
}

export function PortalSidebar({ view, onNavigate, supplierId }: PortalSidebarProps) {
  const profile = getPortalProfile(supplierId);
  const counts = profile.navCounts;

  const navItems: { label: string; view: PortalView; icon: React.ReactNode; count?: number }[] = [
    { label: "Overview", view: "overview", icon: <LayoutDashboard className="w-4 h-4" />, count: counts.overview },
    { label: "Requested Updates", view: "requested-updates", icon: <AlertCircle className="w-4 h-4" />, count: counts["requested-updates"] },
    { label: "Documents", view: "documents", icon: <FileText className="w-4 h-4" />, count: counts.documents },
    { label: "Price agreements", view: "price-agreements", icon: <ReceiptText className="w-4 h-4" />, count: counts["price-agreements"] },
    { label: "Company details", view: "company-details", icon: <Building className="w-4 h-4" />, count: counts["company-details"] },
    { label: "Principals", view: "principals", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0">
      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.count ? (
                <Badge variant="success" className="rounded-full px-1.5">
                  {item.count}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer — profile */}
      <div className="p-3 border-t border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-success-soft text-success-ink text-xs font-semibold flex items-center justify-center shrink-0">
          {initialsOf(profile.fullName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{profile.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
        </div>
      </div>
    </aside>
  );
}
