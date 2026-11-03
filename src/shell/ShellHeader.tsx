import { Bell, Globe, LogOut, ScanEye, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PRINCIPAL_COMPANY } from "@/lib/principal";
import { useI18n, type Lang } from "@/lib/i18n";
import { AppSwitcher } from "./AppSwitcher";
import { ROLES, type PlatformApp, type RoleId } from "./apps";

/*
 * Shell header — the platform's, not any app's.
 *
 * It carries only what is the same in every app: the brand, the app switcher
 * that moves you between services, notifications, language and the signed-in
 * user. The app's own name is deliberately absent — the switcher already names
 * the app you are in, and the page title is the app's business and sits in its
 * own content area. The user's profile lives here, not in an app's sidebar:
 * resetting a password is a platform task (Thomas, 28 Oct).
 */
export function ShellHeader({
  apps,
  activeApp,
  onSelectApp,
  role,
  onRoleChange,
  inspector,
  onInspectorChange,
}: {
  apps: PlatformApp[];
  activeApp?: PlatformApp;
  onSelectApp: (id: string) => void;
  role: RoleId;
  onRoleChange: (role: RoleId) => void;
  inspector: boolean;
  onInspectorChange: (on: boolean) => void;
}) {
  const { t, lang, setLang } = useI18n();
  const user = ROLES.find((r) => r.id === role)!;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          Y
        </span>
        <span className="text-sm font-semibold">Yarowa</span>
      </div>
      <div className="flex-1" />

      <AppSwitcher apps={apps} activeId={activeApp?.id ?? ""} onSelect={onSelectApp} />

      <Tooltip>
        <TooltipTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))} aria-label={t("Notifications")}>
            <Bell />
          </TooltipTrigger>
        <TooltipContent>{t("Notifications from all apps")}</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 uppercase")} aria-label={t("Language")}>
            <Globe />
            {lang}
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>{t("Language")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* The tenant you are signed in to. All three demo roles work for the
          Principal, so it is one name rather than a per-role lookup — but it
          belongs next to the avatar, with the account, not next to the brand. */}
      <span className="max-w-xs truncate text-sm text-muted-foreground">{PRINCIPAL_COMPANY}</span>

      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 px-1.5")} aria-label={t("Account")}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {user.initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{user.person}</span>
            <span className="text-xs font-normal text-muted-foreground">{t(user.label)}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <UserRound />
              {t("Profile and password")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">{t("Demo: view as")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={role} onValueChange={(v) => onRoleChange(v as RoleId)}>
            {ROLES.map((r) => (
              <DropdownMenuRadioItem key={r.id} value={r.id}>
                {t(r.label)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onInspectorChange(!inspector)}>
            <ScanEye />
            {inspector ? t("Hide shell boundaries") : t("Show shell boundaries")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut />
            {t("Sign out")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
