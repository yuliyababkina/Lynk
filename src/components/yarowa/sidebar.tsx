import { Plus, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NAV } from "@/lib/lynk-nav";
import { useI18n } from "@/lib/i18n";
import type { View } from "@/App";

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
  const { t } = useI18n();
  return (
    <aside
      className={cn(
        // White surface with a divider separating it from the content area.
        "bg-card text-sidebar-foreground border-r border-border flex flex-col shrink-0 transition-[width]",
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
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleCollapse}
            className={cn(
              "h-auto shrink-0 rounded border-0 p-1 text-muted-foreground hover:bg-secondary hover:text-foreground dark:hover:bg-secondary",
              collapsed ? "" : "ml-auto"
            )}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        ) : null}
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          const badge = badgeCounts?.[item.id];
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onNavigate(item.id)}
              title={t(item.label)}
              className={cn(
                "h-9 w-full rounded-md border-0 text-sm whitespace-normal",
                collapsed ? "flex items-center justify-center px-3 py-2" : "flex items-center justify-start gap-3 px-3 py-2",
                isActive
                  ? "bg-muted font-medium text-foreground hover:bg-muted dark:hover:bg-muted"
                  : "font-normal text-muted-foreground hover:bg-muted/60 hover:text-muted-foreground dark:hover:bg-muted/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-success" : "text-muted-foreground")} />
              {!collapsed ? <span className="flex-1 text-left">{t(item.label)}</span> : null}
              {!collapsed && !!badge && (
                <Badge variant="success" className="rounded-full px-1.5">
                  {badge}
                </Badge>
              )}
            </Button>
          );
        })}
        <Button
          variant="ghost"
          onClick={onInvite}
          title={t("Invite Supplier")}
          className={cn(
            "mt-2 h-9 w-full rounded-md border-0 text-sm font-normal whitespace-normal text-muted-foreground hover:bg-muted/60 hover:text-muted-foreground dark:hover:bg-muted/60",
            collapsed ? "flex items-center justify-center px-3 py-2" : "flex items-center justify-start gap-3 px-3 py-2"
          )}
        >
          <Plus className="w-4 h-4" />
          {!collapsed ? <span>{t("Invite Supplier")}</span> : null}
        </Button>
      </nav>

      <div className={cn("p-3 border-t border-border flex items-center h-16", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-semibold text-sidebar-primary-foreground">
          SM
        </div>
        {!collapsed ? (
          <div>
            <div className="text-xs font-medium text-sidebar-foreground leading-none">Sabine Müller</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">{t("Procurement Manager")}</div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
