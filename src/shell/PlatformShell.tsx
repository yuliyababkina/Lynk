import { useEffect, useMemo, useState } from "react";
import LynkApp from "@/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { appsForRole, getApp, type PlatformApp, type RoleId } from "./apps";
import { InspectorProvider, Region } from "./inspector";
import { ShellHeader } from "./ShellHeader";
import { WireframeApp } from "./WireframeApp";

/*
 * Platform shell — concept prototype.
 *
 * Mirrors ADR-[004] and the 28 Oct session with Thomas and Iryna:
 *   • the shell owns the frame: header, global app switcher (top right),
 *     notifications, language, the user, footer, and which apps a role may see;
 *   • each app is a micro frontend that owns everything in the content area,
 *     including its inner menu on the left;
 *   • moving between apps is a soft navigation — no full page load, the
 *     session and language carry over.
 *
 * Lynk is the real prototype mounted as a remote (shell mode); the other apps
 * are wireframes because their screens belong to their teams.
 */

function readHash(): string | null {
  const id = window.location.hash.replace(/^#\/?/, "");
  return id || null;
}

export interface PlatformShellProps {
  initialRole?: RoleId;
  initialApp?: string;
  initialInspector?: boolean;
}

export function PlatformShell({
  initialRole = "procurement",
  initialApp,
  initialInspector = false,
}: PlatformShellProps) {
  const { t } = useI18n();
  const [role, setRole] = useState<RoleId>(initialRole);
  const apps = useMemo(() => appsForRole(role), [role]);
  const [appId, setAppId] = useState<string>(() => initialApp ?? readHash() ?? "lynk");
  const [inspector, setInspector] = useState(initialInspector);
  const [loading, setLoading] = useState(false);

  // A role that cannot see the open app lands on its first app instead.
  const activeApp: PlatformApp | undefined = apps.find((a) => a.id === appId) ?? apps[0];

  useEffect(() => {
    if (activeApp && activeApp.id !== appId) setAppId(activeApp.id);
  }, [activeApp, appId]);

  // Deep link: #<app-id> (plain name, so the link survives being shared). The shell owns the URL space; each app owns what follows.
  useEffect(() => {
    if (activeApp && readHash() !== activeApp.id) {
      window.history.replaceState(null, "", `#${activeApp.id}`);
    }
  }, [activeApp]);

  useEffect(() => {
    const onHash = () => {
      const id = readHash();
      if (id && getApp(id)) setAppId(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function selectApp(id: string) {
    if (id === activeApp?.id) return;
    // Simulates fetching the remote — the frame stays, only the content area waits.
    setLoading(true);
    setAppId(id);
    window.setTimeout(() => setLoading(false), 450);
  }

  return (
    <TooltipProvider>
      <InspectorProvider on={inspector}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <Region owner="shell" label={t("header · app switcher · user · language")} className="shrink-0">
            <ShellHeader
              apps={apps}
              activeApp={activeApp}
              onSelectApp={selectApp}
              role={role}
              onRoleChange={setRole}
              inspector={inspector}
              onInspectorChange={setInspector}
            />
          </Region>

          <Region
            owner="mfe"
            label={activeApp ? activeApp.remote : "—"}
            className="flex min-h-0 flex-1"
          >
            {loading || !activeApp ? (
              <RemoteLoading />
            ) : activeApp.render === "lynk" ? (
              // The real Lynk prototype. In the platform this is a remote the shell
              // fetches at runtime (Module Federation); here it is a direct import.
              <LynkApp embedded />
            ) : (
              <WireframeApp key={activeApp.id} app={activeApp} />
            )}
          </Region>

          <Region owner="shell" label={t("footer")} className="shrink-0">
            <footer className="flex h-8 items-center gap-4 border-t bg-card px-4 text-xs text-muted-foreground">
              <span>© Yarowa AG</span>
              <span>{t("Imprint")}</span>
              <span>{t("Privacy")}</span>
              <span className="flex-1" />
              <span>{t("Platform shell · concept")}</span>
            </footer>
          </Region>
        </div>
      </InspectorProvider>
    </TooltipProvider>
  );
}

/** What a user sees while the shell fetches an app: the frame stays put. */
function RemoteLoading() {
  return (
    <div className="flex h-full w-full" aria-busy="true">
      <div className="flex w-64 shrink-0 flex-col gap-2 border-r bg-card p-3">
        <Skeleton className="mb-3 h-6 w-40" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 bg-sidebar p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
