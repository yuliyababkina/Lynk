import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { getPortalProfile, type DocStatus } from "./portal-data";

export interface PortalDocumentsProps {
  supplierId: string;
}

const STATUS_META: Record<DocStatus, { label: string; variant: string }> = {
  valid: { label: "Valid", variant: "success-outline" },
  expiring: { label: "Expiring Soon", variant: "orange-outline" },
  "action-required": { label: "Action required", variant: "warning-outline" },
};

export function PortalDocuments({ supplierId }: PortalDocumentsProps) {
  const profile = getPortalProfile(supplierId);
  const docs = profile.documents;
  const activeUpdate = profile.requestedUpdates[0];

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* All documents */}
      <section className="flex-1 min-w-0 p-6 space-y-3 bg-sidebar">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Compliance files shared with your principals, with expiry status and actions.
          </p>
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Documents</h2>
        <div className="space-y-3">
          {docs.map((doc) => {
            const meta = STATUS_META[doc.status];
            return (
              <Card
                key={doc.id}
                className="rounded-xl border border-border ring-0 shadow-none [--card-spacing:1rem] px-(--card-spacing) hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Expires {doc.expiryLabel}</p>
                    </div>
                  </div>
                  <Badge variant={meta.variant as any} className="shrink-0">
                    {meta.label}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Requested updates rail */}
      {activeUpdate && (
        <aside className="lg:w-[440px] shrink-0 p-6 border-t lg:border-t-0 lg:border-l border-border bg-white">
          <RequestedUpdatePanel update={activeUpdate} />
        </aside>
      )}
    </div>
  );
}
