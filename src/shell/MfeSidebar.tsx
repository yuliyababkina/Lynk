import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n-context";

/*
 * The inner menu every micro frontend renders on the left.
 *
 * The app decides the items; this component decides how an inner menu looks,
 * so Work Orders, Tickets and Lynk all navigate the same way. It is what would
 * live in the shared UI library: the shell does not force it, but an app that
 * uses it gets a menu that matches the rest of the platform for free.
 */
export interface MfeNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function MfeSidebar({
  appName,
  appIcon: AppIcon,
  items,
  activeId,
  onSelect,
  footer,
}: {
  appName: string;
  appIcon: LucideIcon;
  items: MfeNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** App-specific actions under the menu, e.g. Lynk's "Invite supplier". */
  footer?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Sidebar collapsible="none" className="h-full border-r bg-card">
      <SidebarHeader className="h-12 justify-center border-b px-4">
        <div className="flex items-center gap-2">
          <AppIcon className="size-4 text-primary" />
          <span className="truncate text-sm font-semibold">{t(appName)}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === activeId}
                      onClick={() => onSelect(item.id)}
                      tooltip={t(item.label)}
                    >
                      <Icon />
                      <span>{t(item.label)}</span>
                    </SidebarMenuButton>
                    {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer ? <SidebarFooter className="border-t">{footer}</SidebarFooter> : null}
    </Sidebar>
  );
}
