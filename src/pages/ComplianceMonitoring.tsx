import { Fragment, useMemo, useState } from "react";
import { Upload, ChevronRight } from "lucide-react";
import { useLynkData } from "../lib/lynk-data-context";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { useI18n } from "@/lib/i18n-context";
import type { SupplierDoc, DocStatus } from "../types";

const STATUS_META: Record<DocStatus, { label: string; tone: "success" | "warning" | "orange" | "danger" | "info" | "neutral" }> = {
  valid: { label: "Valid", tone: "success" },
  "warning-60": { label: "60-Day Warning", tone: "warning" },
  "warning-30": { label: "30-Day Auto-Notify", tone: "orange" },
  "pending-review": { label: "Pending Review", tone: "info" },
  "rejected-resubmit": { label: "Rejected — Resubmit", tone: "danger" },
  blocked: { label: "Blocked", tone: "neutral" },
};

const TABS = ["All", "Action Required", "Warnings", "Pending Review", "Blocked", "Compliant"] as const;

// Document lifecycle — the stages a compliance document moves through, in order.
// Dot colours mirror the status badges (60-day amber, 30-day orange, etc.).
const LIFECYCLE: { label: string; dot: string }[] = [
  { label: "Valid", dot: "bg-success" },
  { label: "60-Day Warning", dot: "bg-warning" },
  { label: "30-Day Auto-Notify", dot: "bg-chart-orange" },
  { label: "Expired → Blocked", dot: "bg-critical" },
  { label: "Upload → Review", dot: "bg-medium" },
  { label: "Accept → Reactivated", dot: "bg-success" },
];

export function ComplianceMonitoring({
  onSelectDoc,
  selectedDocId,
}: {
  onSelectDoc: (doc: SupplierDoc) => void;
  selectedDocId?: string | null;
  initialSelectedId?: string | null;
}) {
  const { docs: DOCS } = useLynkData();
  const { t: tr } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const filtered = useMemo(() => {
    switch (tab) {
      case "Action Required":
        return DOCS.filter((d) => d.status === "blocked" || d.status === "rejected-resubmit");
      case "Warnings":
        return DOCS.filter((d) => d.status === "warning-60" || d.status === "warning-30");
      case "Pending Review":
        return DOCS.filter((d) => d.status === "pending-review");
      case "Blocked":
        return DOCS.filter((d) => d.status === "blocked");
      case "Compliant":
        return DOCS.filter((d) => d.status === "valid");
      default:
        return DOCS;
    }
  }, [tab, DOCS]);

  const counts = {
    actionRequired: DOCS.filter((d) => d.status === "blocked" || d.status === "rejected-resubmit").length,
    warnings: DOCS.filter((d) => d.status === "warning-60" || d.status === "warning-30").length,
    pending: DOCS.filter((d) => d.status === "pending-review").length,
    blocked: DOCS.filter((d) => d.status === "blocked").length,
    compliant: DOCS.filter((d) => d.status === "valid").length,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">{tr("Compliance Monitoring")}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {tr("Continuous document expiry monitoring. Warnings at 60 days, auto-notification at 30 days, auto-block on expiry.")}
      </p>

      {counts.blocked > 0 && (
        <AlertBanner type="error" title={tr("{count} supplier blocked from work orders", { count: counts.blocked })} className="mb-4">
          {tr("Document expiry passed without renewal. Review any uploaded renewals to reactivate.")}
        </AlertBanner>
      )}

      <div className="grid grid-cols-5 gap-3 mb-4">
        {[
          { label: "Action Required", value: counts.actionRequired },
          { label: "Pending Review", value: counts.pending },
          { label: "60-Day Warnings", value: counts.warnings },
          { label: "Blocked Suppliers", value: counts.blocked },
          { label: "Fully Compliant", value: counts.compliant },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{tr(c.label)}</div>
            <div className="text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {LIFECYCLE.map((stage, i) => (
          <Fragment key={stage.label}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} aria-hidden="true" />
              {tr(stage.label)}
            </span>
            {i < LIFECYCLE.length - 1 && (
              <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
            )}
          </Fragment>
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
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("DOCUMENT / SUPPLIER")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("CATEGORY")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("EXPIRY")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{tr("STATUS")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow
                    key={d.id}
                    onClick={() => onSelectDoc(d)}
                    className={`border-border cursor-pointer hover:bg-secondary/50 ${
                      selectedDocId === d.id ? "bg-secondary/50" : ""
                    }`}
                  >
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <div className="font-medium">{tr(d.documentName)}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.supplierName} · {tr(d.trade)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{tr(d.documentCategory)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <div
                        className={
                          d.daysUntilExpiry < 0
                            ? "text-critical"
                            : d.status === "warning-30"
                              ? "text-chart-orange-ink"
                              : "text-warning-ink"
                        }
                      >
                        {d.expiryDate}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.daysUntilExpiry < 0
                          ? tr("Expired {days}d ago", { days: Math.abs(d.daysUntilExpiry) })
                          : tr("{days}d remaining", { days: d.daysUntilExpiry })}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <Badge variant={STATUS_META[d.status].tone}>{tr(STATUS_META[d.status].label)}</Badge>
                      {d.renewal && (
                        <div className="flex items-center gap-1 text-xs text-accent mt-1">
                          <Upload size={11} />
                          {tr("Upload awaiting review")}
                        </div>
                      )}
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
