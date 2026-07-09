import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { DATA_GOVERNANCE_REQUESTS } from "../data";
import { Badge, Button, Pill } from "../components/ui";

const TABS = ["All Requests", "Awaiting Review", "Endorsed — Awaiting 2nd Approval", "Approved", "Rejected"] as const;

export function DataGovernance({ initialSelectedId }: { initialSelectedId?: string | null }) {
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
      <h1 className="text-2xl font-bold mb-1">Master Data Governance</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Sensitive data changes require four-eyes approval before taking effect. Every change is logged to the immutable audit trail.
      </p>

      {counts.awaiting > 0 && (
        <div className="flex items-start gap-2 bg-red-50 text-red-900 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5" />
          <div>
            <div className="font-medium">{counts.awaiting} critical payment data change awaiting review</div>
            <div className="text-xs opacity-80">
              IBAN and banking changes carry the highest fraud risk. Review carefully and verify with the supplier directly before endorsing.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Awaiting Review", value: counts.awaiting },
          { label: "Endorsed", value: counts.endorsed },
          { label: "Approved", value: counts.approved },
          { label: "Rejected", value: counts.rejected },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4 border-b border-border pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <Pill key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Pill>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expanded === r.id;
          return (
            <div key={r.id} className="bg-card border border-border rounded-lg">
              <button
                onClick={() => setExpanded(isOpen ? null : r.id)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="font-medium">{r.supplierName}</span>
                  <Badge tone="neutral">{r.category}</Badge>
                  {r.risk === "Critical" && <Badge tone="danger">Critical</Badge>}
                  <span className="text-xs text-muted-foreground">
                    Requested by {r.requestedBy} · {r.requestedAt}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="warning">{r.status}</Badge>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 text-sm border-t border-border pt-3">
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Supplier's stated reason
                    </div>
                    <div>{r.reason}</div>
                  </div>

                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    {r.fields.length} fields changing
                  </div>
                  {r.fields.map((f) => (
                    <div key={f.label} className="border border-border rounded-md overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/60 text-xs font-medium">
                        {f.label}
                        {f.sensitive && (
                          <span className="flex items-center gap-1 text-amber-700">
                            <Lock size={11} /> Sensitive
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="px-3 py-2">
                          <div className="text-xs text-muted-foreground">Before</div>
                          <div className="font-mono text-xs">{f.before}</div>
                        </div>
                        <div className="px-3 py-2 bg-emerald-50">
                          <div className="text-xs text-muted-foreground">After</div>
                          <div className="font-mono text-xs">{f.after}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-4 pt-2">
                    <div className="text-xs">
                      <div className="text-muted-foreground">Four-eyes approval progress</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge tone={r.approvalStep >= 1 ? "info" : "neutral"}>1. First Review</Badge>
                        <Badge tone="neutral">2. Final Approval</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline">Reject Change</Button>
                    <Button variant="default">Endorse — First Review</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
