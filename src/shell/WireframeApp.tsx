import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import type { PlatformApp, WireframeBlock } from "./apps";
import { Region } from "./inspector";
import { MfeSidebar } from "./MfeSidebar";
import { Text } from "@/shared/ui/typography";

/*
 * A placeholder micro frontend. Real inner menu (so switching inside the app
 * works), wireframe content — these apps are owned by other teams and their
 * screens are theirs to design. What matters here is the frame they sit in.
 */
export function WireframeApp({ app }: { app: PlatformApp }) {
  const { t } = useI18n();
  const [active, setActive] = useState(app.nav[0]?.id ?? "");
  const item = app.nav.find((n) => n.id === active) ?? app.nav[0];
  const blocks = app.wireframe?.[active] ?? Object.values(app.wireframe ?? {})[0] ?? [];

  return (
    <SidebarProvider className="h-full min-h-0">
      <Region owner="mfe" label={t("inner menu")} className="h-full">
        <MfeSidebar
          appName={app.name}
          appIcon={app.icon}
          items={app.nav}
          activeId={active}
          onSelect={setActive}
        />
      </Region>
      {/* Skeletons a step darker than the default: on the grey content surface the
          stock tint all but disappeared, and a wireframe has to read on a projector. */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-sidebar [&_[data-slot=skeleton]]:bg-foreground/[0.07]">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-6">
          <Text variant="label" as="span">{item ? t(item.label) : ""}</Text>
          <Badge variant="outline" className="ml-1 font-normal text-muted-foreground">
            {t("Wireframe")}
          </Badge>
          {app.external ? (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {t("External front end")}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32 bg-primary/20!" />
          </div>
          {blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      </main>
    </SidebarProvider>
  );
}

function Block({ block }: { block: WireframeBlock }) {
  const { t } = useI18n();
  const label = t(block.label);
  switch (block.kind) {
    case "kpis":
      return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {label.split(" · ").map((k, i) => (
            <Card key={i} size="sm">
              <CardContent className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">{k}</span>
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    case "table":
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4">
              {[0, 1, 2, 3].map((c) => (
                <Skeleton key={c} className="h-3 w-2/3 bg-foreground/15!" />
              ))}
            </div>
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <div key={r} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-t pt-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    case "list":
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((r) => (
              <div key={r} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    case "chart":
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-3">
              {["h-[40%]", "h-[65%]", "h-[50%]", "h-[80%]", "h-[60%]", "h-[90%]", "h-[70%]", "h-[55%]", "h-[85%]", "h-[75%]", "h-[95%]", "h-[68%]"].map((h, i) => (
                <Skeleton key={i} className={`flex-1 rounded-sm ${h}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      );
    case "form":
      return (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3, 4, 5].map((f) => (
              <div key={f} className={cn("flex flex-col gap-1.5", f === 4 && "col-span-2")}>
                <Skeleton className="h-3 w-24 bg-foreground/15!" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    case "split": {
      const [left, right] = label.split("  |  ");
      return (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{left}</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{right ?? left}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <Skeleton key={r} className="h-9 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      );
    }
    case "cards":
      return (
        <div className="flex flex-col gap-3">
          <Text variant="label" as="span">{label}</Text>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((c) => (
              <Card key={c} size="sm">
                <CardContent className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
  }
}
