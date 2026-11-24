import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLynkData } from "../lib/lynk-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { DataChangeBody } from "@/components/yarowa/data-change-body";
import { DATA_CHANGE_STATUS_VARIANT } from "@/lib/ticket-panel";
import { useI18n } from "@/lib/i18n-context";
import { Heading, Text } from "@/shared/ui/typography";

const TABS = ["All Requests", "Awaiting Review", "Endorsed — Awaiting 2nd Approval", "Approved", "Rejected"] as const;

export function DataGovernance({ initialSelectedId }: { initialSelectedId?: string | null }) {
  const { dataGovernanceRequests: DATA_GOVERNANCE_REQUESTS } = useLynkData();
  const { t: tr } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Requests");
  const [expanded, setExpanded] = useState<string | null>(initialSelectedId ?? DATA_GOVERNANCE_REQUESTS[0]?.id ?? null);

  const counts = {
    awaiting: DATA_GOVERNANCE_REQUESTS.filter((r) => r.status === "Awaiting Review").length,
    endorsed: DATA_GOVERNANCE_REQUESTS.filter((r) => r.status === "Endorsed — Awaiting 2nd Approval").length,
    approved: DATA_GOVERNANCE_REQUESTS.filter((r) => r.status === "Approved").length,
    rejected: DATA_GOVERNANCE_REQUESTS.filter((r) => r.status === "Rejected").length,
  };

  const filtered =
    tab === "All Requests" ? DATA_GOVERNANCE_REQUESTS : DATA_GOVERNANCE_REQUESTS.filter((r) => r.status === tab);

  return (
    <div className="p-6">
      <Heading level={1} className="mb-1">{tr("Master Data Governance")}</Heading>
      <p className="text-sm text-muted-foreground mb-4">
        {tr("Sensitive data changes require four-eyes approval before taking effect. Every change is logged to the immutable audit trail.")}
      </p>

      {counts.awaiting > 0 && (
        <AlertBanner
          type="error"
          title={tr("{count} critical payment data change awaiting review", { count: counts.awaiting })}
          className="mb-4"
        >
          {tr("IBAN and banking changes carry the highest fraud risk. Review carefully and verify with the supplier directly before endorsing.")}
        </AlertBanner>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Awaiting Review", value: counts.awaiting },
          { label: "Endorsed", value: counts.endorsed },
          { label: "Approved", value: counts.approved },
          { label: "Rejected", value: counts.rejected },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{tr(c.label)}</div>
            <Text variant="stat" as="div">{c.value}</Text>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])} className="gap-4">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {tr(t)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <div className="space-y-3">
            {filtered.map((r) => {
              const isOpen = expanded === r.id;
              return (
                <div key={r.id} className="bg-card border border-border rounded-xl">
                  <Button
                    variant="ghost"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="flex h-auto w-full justify-between gap-0 rounded-none border-0 px-4 py-3 font-normal leading-normal whitespace-normal hover:bg-transparent dark:hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium">{r.supplierName}</span>
                      <Badge variant="neutral">{tr(r.category)}</Badge>
                      {r.risk === "Critical" && <Badge variant="danger">{tr("Critical")}</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {tr("Requested by {who} · {when}", { who: r.requestedBy, when: r.requestedAt })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={DATA_CHANGE_STATUS_VARIANT[r.status]}>{tr(r.status)}</Badge>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </Button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 text-sm border-t border-border pt-3">
                      <DataChangeBody request={r} layout="split" />

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline">{tr("Reject Change")}</Button>
                        <Button variant="default">{tr("Endorse — First Review")}</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
