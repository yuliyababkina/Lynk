import { useState } from "react";
import { ClickableCard, ClickableCardTrigger } from "@/components/yarowa/clickable-card";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
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
                <ClickableCard
                  key={u.id}
                  active={active}
                  className="[--card-spacing:1rem] px-(--card-spacing) gap-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <ClickableCardTrigger onClick={() => setSelectedId(u.id)} aria-current={active || undefined} className="min-w-0">
                      <Heading level={4} as="span" className="text-primary truncate">{u.principal}</Heading>
                    </ClickableCardTrigger>
                    <Badge variant="warning">{t("Action required")}</Badge>
                  </div>
                  {/* Subject and body are principal-authored free text: they go
                      through the machine-translation seam, not this dictionary. */}
                  <Text variant="label" className="mt-1 line-clamp-2">{u.subject}</Text>
                  <p className="text-xs text-muted-foreground mt-2">
                    {u.from} · {t(u.sentLabel)}
                  </p>
                </ClickableCard>
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
