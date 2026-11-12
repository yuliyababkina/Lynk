import { useMemo, useState } from "react";
import { useLynkData } from "../lib/lynk-data-context";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import type { Contract, ContractStatus } from "../types";
import { useI18n } from "@/lib/i18n-context";
import { Heading, Text } from "@/shared/ui/typography";

const STATUS_TONE: Record<ContractStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  Active: "success",
  "Expiring Soon": "warning",
  "Renewal Urgent": "danger",
  "Renewal in Progress": "info",
  "Opted Out": "neutral",
};

const TABS = ["All", "Urgent", "Expiring", "Active", "In Progress", "Closed"] as const;

export function ContractManagement({
  onSelectContract,
  initialSelectedId,
}: {
  onSelectContract: (c: Contract) => void;
  initialSelectedId?: string | null;
}) {
  const { contracts: CONTRACTS } = useLynkData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const { t: tr } = useI18n();

  const filtered = useMemo(() => {
    switch (tab) {
      case "Urgent":
        return CONTRACTS.filter((c) => c.status === "Renewal Urgent");
      case "Expiring":
        return CONTRACTS.filter((c) => c.status === "Expiring Soon");
      case "Active":
        return CONTRACTS.filter((c) => c.status === "Active");
      case "In Progress":
        return CONTRACTS.filter((c) => c.status === "Renewal in Progress");
      case "Closed":
        return CONTRACTS.filter((c) => c.status === "Opted Out");
      default:
        return CONTRACTS;
    }
  }, [tab, CONTRACTS]);

  const urgent = CONTRACTS.filter((c) => c.status === "Renewal Urgent").length;

  return (
    <div className="p-6">
      <Heading level={1} className="mb-1">{tr("Contract Management")}</Heading>
      <p className="text-sm text-muted-foreground mb-4">
        {tr("Framework contracts, renewal deadlines, and full history. No contract lapses without a decision.")}
      </p>

      {urgent > 0 && (
        <AlertBanner type="error" title={tr("{count} contract require immediate action", { count: urgent })} className="mb-4">
          {tr("The renewal deadline has passed or is within 30 days. Initiate renewal or opt-out now to avoid a lapsed contract.")}
        </AlertBanner>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Renewal Urgent", value: urgent },
          { label: "Expiring (90d)", value: CONTRACTS.filter((c) => c.status === "Expiring Soon").length },
          { label: "Active", value: CONTRACTS.filter((c) => c.status === "Active").length },
          { label: "Renewal in Progress", value: CONTRACTS.filter((c) => c.status === "Renewal in Progress").length },
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
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs border-border hover:bg-transparent">
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("SUPPLIER / CONTRACT")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("ANNUAL VALUE")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("END DATE")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("TIME LEFT")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("STATUS")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => onSelectContract(c)}
                    className={`border-border cursor-pointer hover:bg-secondary/50 ${
                      initialSelectedId === c.id ? "bg-secondary/50" : ""
                    }`}
                  >
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <div className="font-medium">{c.supplierName}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.ref} · {tr(c.type)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{tr("€{value} per year", { value: c.annualValue.toLocaleString() })}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <div>{c.endDate}</div>
                      <div className="text-xs text-muted-foreground">
                        {tr("Renewal by {date} · {notice} notice req.", { date: c.renewalBy, notice: c.noticePeriod })}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{c.timeLeftLabel}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <Badge variant={STATUS_TONE[c.status]}>{c.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
