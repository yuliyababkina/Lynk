import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const profile = getPortalProfile(supplierId);
  const counts = getPortalNavCounts(profile);

  /* Labels stay in English here and are translated where they render — the
     English string is the dictionary key. Title Case throughout, matching the
     page headings these items lead to and the keys in i18n.tsx. */
  const navItems: { label: string; view: PortalView; icon: React.ReactNode; count?: number }[] = [
    { label: "Overview", view: "overview", icon: <LayoutDashboard className="w-4 h-4" />, count: counts.overview },
    { label: "Requested Updates", view: "requested-updates", icon: <AlertCircle className="w-4 h-4" />, count: counts["requested-updates"] },
    { label: "Documents", view: "documents", icon: <FileText className="w-4 h-4" />, count: counts.documents },
    { label: "Price Agreements", view: "price-agreements", icon: <DollarSign className="w-4 h-4" />, count: counts["price-agreements"] },
    { label: "Company Details", view: "company-details", icon: <Building className="w-4 h-4" />, count: counts["company-details"] },
    { label: "Principals", view: "principals", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={cn(
        // White surface with a divider separating it from the content area.
        "bg-card border-r border-border flex flex-col shrink-0 transition-[width]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          // Light, matching the top bar beside it: the two together read as one
          // continuous strip rather than a navy block abutting a white one.
          "h-12 border-b border-border bg-card text-foreground",
          collapsed ? "flex items-center justify-center px-2" : "flex items-center gap-2 px-4"
        )}
      >
        <div className="w-7 h-7 shrink-0 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
          L
        </div>
        {!collapsed ? (
          <div>
            <div className="text-sm font-semibold leading-none">Lynk</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">{t("Procurement Platform")}</div>
          </div>
        ) : null}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
              collapsed ? "" : "ml-auto"
            )}
            aria-label={collapsed ? t("Expand menu") : t("Collapse menu")}
            title={collapsed ? t("Expand menu") : t("Collapse menu")}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              title={t(item.label)}
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
              {!collapsed ? <span className="text-left leading-none">{t(item.label)}</span> : null}
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
