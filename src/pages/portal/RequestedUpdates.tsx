import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { cn } from "@/lib/utils";
import { getPortalProfile } from "./portal-data";

export interface PortalRequestedUpdatesProps {
  supplierId: string;
}

export function PortalRequestedUpdates({ supplierId }: PortalRequestedUpdatesProps) {
  const profile = getPortalProfile(supplierId);
  const updates = profile.requestedUpdates;
  const [selectedId, setSelectedId] = useState<string>(updates[0]?.id ?? "");
  const selected = updates.find((u) => u.id === selectedId) ?? updates[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Requested Updates</h1>
        {updates.length > 0 && <Badge variant="critical">{updates.length}</Badge>}
      </div>

      {updates.length === 0 || !selected ? (
        <AlertBanner type="success" title="No pending updates">
          All information your principals need is up to date.
        </AlertBanner>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* List */}
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
                    "p-4 rounded-2xl ring-0 shadow-none [--card-spacing:0px] gap-0 cursor-pointer transition-colors",
                    active ? "border border-primary bg-secondary/60" : "border border-border hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary truncate">{u.principal}</p>
                    <Badge variant="warning">Action required</Badge>
                  </div>
                  <p className="text-sm font-medium mt-1 line-clamp-2">{u.subject}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {u.from} · {u.sentLabel}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* Detail */}
          <div className="max-w-xl">
            <RequestedUpdatePanel update={selected} />
          </div>
        </div>
      )}
    </div>
  );
}
