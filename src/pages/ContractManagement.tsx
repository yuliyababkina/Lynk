import { useMemo, useState } from "react";
import { CONTRACTS } from "../data";
import { Alert, Badge, Pill } from "../ui";
import type { Contract, ContractStatus } from "../types";

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
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

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
  }, [tab]);

  const urgent = CONTRACTS.filter((c) => c.status === "Renewal Urgent").length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Contract Management</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Framework contracts, renewal deadlines, and full history. No contract lapses without a decision.
      </p>

      {urgent > 0 && (
        <Alert type="error" title={`${urgent} contract require immediate action`} className="mb-4">
          The renewal deadline has passed or is within 30 days. Initiate renewal or opt-out now to
          avoid a lapsed contract.
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Renewal Urgent", value: urgent },
          { label: "Expiring (90d)", value: CONTRACTS.filter((c) => c.status === "Expiring Soon").length },
          { label: "Active", value: CONTRACTS.filter((c) => c.status === "Active").length },
          { label: "Renewal in Progress", value: CONTRACTS.filter((c) => c.status === "Renewal in Progress").length },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl font-bold">{c.value}</div>
          </div>
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
              <th className="px-4 py-2 font-medium">SUPPLIER / CONTRACT</th>
              <th className="px-4 py-2 font-medium">ANNUAL VALUE</th>
              <th className="px-4 py-2 font-medium">END DATE</th>
              <th className="px-4 py-2 font-medium">TIME LEFT</th>
              <th className="px-4 py-2 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectContract(c)}
                className={`border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${
                  initialSelectedId === c.id ? "bg-secondary/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{c.supplierName}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.ref} · {c.type}
                  </div>
                </td>
                <td className="px-4 py-3">€{c.annualValue.toLocaleString()} per year</td>
                <td className="px-4 py-3">
                  <div>{c.endDate}</div>
                  <div className="text-xs text-muted-foreground">
                    Renewal by {c.renewalBy} · {c.noticePeriod} notice req.
                  </div>
                </td>
                <td className="px-4 py-3">{c.timeLeftLabel}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
