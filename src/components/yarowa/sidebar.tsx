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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { View } from "@/App";

const NAV: { id: View; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "suppliers", label: "Suppliers", icon: Users },
  { id: "data-governance", label: "Data Governance", icon: Shield, badge: 2 },
  { id: "onboarding", label: "Onboarding", icon: Rocket, badge: 3 },
  { id: "compliance", label: "Compliance", icon: ShieldCheck, badge: 3 },
  { id: "contracts", label: "Contracts", icon: FileText, badge: 1 },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
  { id: "service-catalogue", label: "Service Catalogue", icon: ClipboardList },
];

export function Sidebar({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <aside className="w-[220px] bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
          L
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-none">Lynk</div>
          <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Procurement Platform</div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {!!item.badge && (
                <span className="text-[10px] bg-sidebar-accent text-muted-foreground rounded-full px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent/60 mt-2">
          <Plus size={16} />
          <span>Invite Supplier</span>
        </button>
      </nav>

      <div className="p-3 border-t border-sidebar-border flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-semibold text-white">
          SM
        </div>
        <div>
          <div className="text-xs font-medium text-white leading-none">Sabine Müller</div>
          <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Procurement Manager</div>
        </div>
      </div>
    </aside>
  );
}
