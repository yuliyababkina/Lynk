import { Fragment, useMemo, useState } from "react";
import { Upload, ChevronRight } from "lucide-react";
import { DOCS } from "../data";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/yarowa/pill";
import { AlertBanner } from "@/components/yarowa/alert-banner";
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
  }, [tab]);

  const counts = {
    actionRequired: DOCS.filter((d) => d.status === "blocked" || d.status === "rejected-resubmit").length,
    warnings: DOCS.filter((d) => d.status === "warning-60" || d.status === "warning-30").length,
    pending: DOCS.filter((d) => d.status === "pending-review").length,
    blocked: DOCS.filter((d) => d.status === "blocked").length,
    compliant: DOCS.filter((d) => d.status === "valid").length,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Compliance Monitoring</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Continuous document expiry monitoring. Warnings at 60 days, auto-notification at 30 days, auto-block on expiry.
      </p>

      {counts.blocked > 0 && (
        <AlertBanner type="error" title={`${counts.blocked} supplier blocked from work orders`} className="mb-4">
          Document expiry passed without renewal. Review any uploaded renewals to reactivate.
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
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {LIFECYCLE.map((stage, i) => (
          <Fragment key={stage.label}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} aria-hidden="true" />
              {stage.label}
            </span>
            {i < LIFECYCLE.length - 1 && (
              <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
            )}
          </Fragment>
        ))}
      </div>

      <div className="flex gap-1 mb-4 border-b border-border pb-2">
        {TABS.map((t) => (
          <Pill key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Pill>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">DOCUMENT / SUPPLIER</th>
              <th className="px-4 py-2 font-medium">CATEGORY</th>
              <th className="px-4 py-2 font-medium">EXPIRY</th>
              <th className="px-4 py-2 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                onClick={() => onSelectDoc(d)}
                className={`border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${
                  selectedDocId === d.id ? "bg-secondary/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{d.documentName}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.supplierName} · {d.trade}
                  </div>
                </td>
                <td className="px-4 py-3">{d.documentCategory}</td>
                <td className="px-4 py-3">
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
                    {d.daysUntilExpiry < 0 ? `Expired ${Math.abs(d.daysUntilExpiry)}d ago` : `${d.daysUntilExpiry}d remaining`}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_META[d.status].tone}>{STATUS_META[d.status].label}</Badge>
                  {d.renewal && (
                    <div className="flex items-center gap-1 text-xs text-accent mt-1">
                      <Upload size={11} />
                      Upload awaiting review
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
