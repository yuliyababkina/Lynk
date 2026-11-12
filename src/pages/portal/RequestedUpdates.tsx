import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { getPortalProfile } from "./portal-data";
import { Heading, Text } from "@/shared/ui/typography";

export interface PortalRequestedUpdatesProps {
  supplierId: string;
}

export function PortalRequestedUpdates({ supplierId }: PortalRequestedUpdatesProps) {
  const { t } = useI18n();
  const profile = getPortalProfile(supplierId);
  const updates = profile.requestedUpdates;
  const [selectedId, setSelectedId] = useState<string>(updates[0]?.id ?? "");
  const selected = updates.find((u) => u.id === selectedId) ?? updates[0];

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      <section className="flex-1 min-w-0 p-6 space-y-6 bg-sidebar">
        <div>
          <Heading level={1}>{t("Requested Updates")}</Heading>
          <p className="text-muted-foreground mt-1">
            {t("Review principal requests, update company data, and confirm changes.")}
          </p>
        </div>

        {updates.length === 0 || !selected ? (
          <AlertBanner type="success" title={t("No pending updates")}>
            {t("All information your principals need is up to date.")}
          </AlertBanner>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => {
              const active = u.id === selected.id;
              return (
                <Card
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(u.id)}
                  className={cn(
                    "rounded-2xl ring-0 shadow-none [--card-spacing:1rem] px-(--card-spacing) gap-0 cursor-pointer transition-colors",
                    active ? "border border-primary bg-secondary/60" : "border border-border hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Heading level={4} as="div" className="text-primary truncate">{u.principal}</Heading>
                    <Badge variant="warning">{t("Action required")}</Badge>
                  </div>
                  {/* Subject and body are principal-authored free text: they go
                      through the machine-translation seam, not this dictionary. */}
                  <Text variant="label" className="mt-1 line-clamp-2">{u.subject}</Text>
                  <p className="text-xs text-muted-foreground mt-2">
                    {u.from} · {t(u.sentLabel)}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {updates.length > 0 && selected && (
        <aside className="lg:w-[440px] shrink-0 p-6 border-t lg:border-t-0 lg:border-l border-border bg-card">
          <RequestedUpdatePanel update={selected} />
        </aside>
      )}
    </div>
  );
}
