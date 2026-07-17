import {
  LayoutGrid,
  Users,
  Shield,
  ShieldCheck,
  FileText,
  BarChart3,
  ClipboardList,
  Rocket,
  Plus,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { View } from "@/App";

const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "suppliers", label: "Suppliers", icon: Users },
  { id: "data-governance", label: "Data Governance", icon: Shield },
  { id: "onboarding", label: "Onboarding", icon: Rocket },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
  { id: "service-catalogue", label: "Service Catalogue", icon: ClipboardList },
];

export function Sidebar({
  view,
  onNavigate,
  onInvite,
  badgeCounts,
  collapsed = false,
  onToggleCollapse,
}: {
  view: View;
  onNavigate: (v: View) => void;
  onInvite: () => void;
  badgeCounts?: Partial<Record<View, number>>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <aside
      className={cn(
        "bg-white text-sidebar-foreground flex flex-col shrink-0 transition-[width]",
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
      <nav className="flex-1 p-3 space-y-0.5 border-l border-border">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          const badge = badgeCounts?.[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={cn(
                "w-full rounded-md text-sm transition-colors h-9",
                collapsed ? "flex items-center justify-center px-3 py-2" : "flex items-center gap-3 px-3 py-2",
                isActive
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-success" : "text-muted-foreground")} />
              {!collapsed ? <span className="flex-1 text-left">{item.label}</span> : null}
              {!collapsed && !!badge && (
                <Badge variant="success" className="rounded-full px-1.5">
                  {badge}
                </Badge>
              )}
            </button>
          );
        })}
        <button
          onClick={onInvite}
          title="Invite Supplier"
          className={cn(
            "w-full rounded-md text-sm text-muted-foreground hover:bg-muted/60 mt-2 h-9",
            collapsed ? "flex items-center justify-center px-3 py-2" : "flex items-center gap-3 px-3 py-2"
          )}
        >
          <Plus className="w-4 h-4" />
          {!collapsed ? <span>Invite Supplier</span> : null}
        </button>
      </nav>

      <div className={cn("p-3 border-t border-border flex items-center h-16", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-semibold text-white">
          SM
        </div>
        {!collapsed ? (
          <div>
            <div className="text-xs font-medium text-sidebar-foreground leading-none">Sabine Müller</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Procurement Manager</div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
