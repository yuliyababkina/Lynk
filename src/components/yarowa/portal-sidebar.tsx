import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PortalView } from "@/pages/SupplierPortal";
import { getPortalNavCounts, getPortalProfile, initialsOf } from "@/pages/portal/portal-data";
import { LayoutDashboard, AlertCircle, FileText, DollarSign, Building, Users, PanelLeft } from "lucide-react";

export interface PortalSidebarProps {
  view: PortalView;
  onNavigate: (view: PortalView) => void;
  supplierId: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function PortalSidebar({
  view,
  onNavigate,
  supplierId,
  collapsed = false,
  onToggleCollapse,
}: PortalSidebarProps) {
  const profile = getPortalProfile(supplierId);
  const counts = getPortalNavCounts(profile);

  const navItems: { label: string; view: PortalView; icon: React.ReactNode; count?: number }[] = [
    { label: "Overview", view: "overview", icon: <LayoutDashboard className="w-4 h-4" />, count: counts.overview },
    { label: "Requested Updates", view: "requested-updates", icon: <AlertCircle className="w-4 h-4" />, count: counts["requested-updates"] },
    { label: "Documents", view: "documents", icon: <FileText className="w-4 h-4" />, count: counts.documents },
    { label: "Price agreements", view: "price-agreements", icon: <DollarSign className="w-4 h-4" />, count: counts["price-agreements"] },
    { label: "Company details", view: "company-details", icon: <Building className="w-4 h-4" />, count: counts["company-details"] },
    { label: "Principals", view: "principals", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={cn(
        "bg-white flex flex-col shrink-0 transition-[width]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "h-12 border-b border-white/10 bg-brand-navy text-white",
          collapsed ? "flex items-center justify-center px-2" : "flex items-center gap-2 px-4"
        )}
      >
        <div className="w-7 h-7 shrink-0 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
          L
        </div>
        {!collapsed ? (
          <div>
            <div className="text-sm font-semibold text-white leading-none">Lynk</div>
            <div className="text-[10px] text-white/60 leading-none mt-0.5">Procurement Platform</div>
          </div>
        ) : null}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "shrink-0 rounded p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors",
              collapsed ? "" : "ml-auto"
            )}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 border-l border-border">
        {navItems.map((item) => {
          const active = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              title={item.label}
              className={cn(
                "w-full rounded-md text-sm transition-colors h-9",
                collapsed
                  ? "flex items-center justify-center px-3 py-2"
                  : "grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2",
                active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "inline-flex w-5 h-5 items-center justify-center",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
              </span>
              {!collapsed ? <span className="text-left leading-none">{item.label}</span> : null}
              {!collapsed && item.count ? (
                <Badge variant="success" className="rounded-full px-1.5">
                  {item.count}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer — profile */}
      <div
        className={cn(
          "border-t border-border flex items-center p-3 h-16",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-success-soft text-success-ink text-xs font-semibold flex items-center justify-center shrink-0">
          {initialsOf(profile.fullName)}
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{profile.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
