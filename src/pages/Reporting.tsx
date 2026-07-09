import { Download } from "lucide-react";
import { Button, Pill } from "../ui";
import { useState } from "react";

export function Reporting() {
  const [period, setPeriod] = useState<"Q1 2026" | "Q4 2025" | "Last 12 months">("Q1 2026");

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Supplier Performance Report</h1>
          <p className="text-sm text-muted-foreground">
            KPIs, compliance rates, and supplier ratings. Filter before generating for management or audit use.
          </p>
        </div>
        <Button>
          <Download size={14} /> Generate Report
        </Button>
      </div>

      <div className="flex gap-1 mb-4">
        {(["Q1 2026", "Q4 2025", "Last 12 months"] as const).map((p) => (
          <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p}
          </Pill>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-3 mb-5">
        {[
          { label: "Compliance Rate", value: "76%", delta: "-5pp vs prior period" },
          { label: "Avg Supplier Score", value: "80", delta: "-1 pts vs prior period" },
          { label: "Active Suppliers", value: "10", delta: "+2 onboarded this period" },
          { label: "At Risk", value: "4", delta: "red or warning compliance" },
          { label: "Critical Flags", value: "1", delta: "require immediate action" },
          { label: "Prospects Pending", value: "3", delta: "awaiting onboarding completion" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="text-xl font-bold">{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{c.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="font-semibold text-sm mb-1">Compliance Rate & Avg Score Trend</div>
          <div className="text-xs text-muted-foreground mb-3">Across all suppliers · {period}</div>
          <div className="h-40 flex items-end gap-3 px-2">
            {[81, 79, 83, 80].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-accent/20 rounded-t" style={{ height: `${v}%` }} />
                <span className="text-[10px] text-muted-foreground">{["Q2 25", "Q3 25", "Q4 25", "Q1 26"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="font-semibold text-sm mb-1">Score Distribution</div>
          <div className="text-xs text-muted-foreground mb-3">Active suppliers by score band</div>
          <div className="h-40 flex items-end gap-3 px-2">
            {[
              { band: "90-100", v: 2, color: "bg-success" },
              { band: "80-89", v: 3, color: "bg-success/70" },
              { band: "70-79", v: 2, color: "bg-high" },
              { band: "60-69", v: 1, color: "bg-chart-orange" },
              { band: "<60", v: 1, color: "bg-critical" },
            ].map((b) => (
              <div key={b.band} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full ${b.color} rounded-t`} style={{ height: `${b.v * 25}%` }} />
                <span className="text-[10px] text-muted-foreground">{b.band}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="font-semibold text-sm mb-1">Compliance Rate by Trade</div>
          <div className="text-xs text-muted-foreground mb-3">Percentage of suppliers with no critical flags</div>
          <div className="space-y-2">
            {[
              { label: "Consulting", v: 100, color: "bg-success" },
              { label: "HVAC", v: 100, color: "bg-success" },
              { label: "Plumbing", v: 100, color: "bg-success" },
              { label: "IT Services", v: 65, color: "bg-critical" },
              { label: "Manufacturing", v: 40, color: "bg-critical" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-muted-foreground">{r.label}</span>
                <div className="flex-1 bg-secondary rounded h-2">
                  <div className={`${r.color} h-2 rounded`} style={{ width: `${r.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="font-semibold text-sm mb-1">Network Composition</div>
          <div className="text-xs text-muted-foreground mb-3">Contacts by lifecycle stage</div>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full border-[14px] border-accent border-r-success border-b-purple" />
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-medium" /> 3 Prospects
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" /> 5 Suppliers
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple" /> 2 Providers
              </div>
              <div className="text-xs text-muted-foreground pt-1">10 total network contacts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
