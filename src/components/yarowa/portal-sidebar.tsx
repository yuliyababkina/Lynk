import { cn } from "@/lib/utils";
import type { PortalView } from "@/pages/SupplierPortal";
import { Home, Users, FileText, AlertCircle, Building, LogOut } from "lucide-react";

export interface PortalSidebarProps {
  view: PortalView;
  onNavigate: (view: PortalView) => void;
  supplierName: string;
}

export function PortalSidebar({ view, onNavigate, supplierName }: PortalSidebarProps) {
  const navItems: { label: string; view: PortalView; icon: React.ReactNode }[] = [
    { label: "Overview", view: "overview", icon: <Home className="w-4 h-4" /> },
    { label: "Principals", view: "principals", icon: <Users className="w-4 h-4" /> },
    { label: "Requested Updates", view: "requested-updates", icon: <AlertCircle className="w-4 h-4" /> },
    { label: "Documents", view: "documents", icon: <FileText className="w-4 h-4" /> },
    { label: "Company Details", view: "company-details", icon: <Building className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Supplier Portal</h2>
        <p className="text-xs text-muted-foreground mt-1">{supplierName}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              view === item.view
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" />
          Switch Account
        </button>
      </div>
    </aside>
  );
}
