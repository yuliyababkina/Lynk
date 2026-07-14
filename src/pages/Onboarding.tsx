import { useMemo, useState } from "react";
import { useLynkData } from "../lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/yarowa/pill";

export function Onboarding({
  initialSelectedId,
}: {
  initialSelectedId?: string | null;
}) {
  const { onboardingCases: ONBOARDING_CASES } = useLynkData();
  const [tab, setTab] = useState<"All" | "Stale">("All");
  const [selected, setSelected] = useState<string | null>(initialSelectedId ?? null);

  // Newly invited prospects (added via addOnboardingCase) already sit at the
  // front of ONBOARDING_CASES — see LynkDataContext.
  const cases = useMemo(() => ONBOARDING_CASES, [ONBOARDING_CASES]);

  const filtered = useMemo(
    () => (tab === "Stale" ? cases.filter((c) => c.status === "Stale") : cases),
    [tab, cases]
  );

  const stale = cases.filter((c) => c.status === "Stale").length;
  const highPriority = cases.filter((c) => c.criticality === "high").length;
  const selectedCase = cases.find((c) => c.id === selected);

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold mb-1">Onboarding</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Prospect invitations that are stale or incomplete. Follow up to keep your pipeline moving.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Open Invitations", value: cases.length },
            { label: "High Priority", value: highPriority },
            { label: "Stale", value: stale },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-4">
          <Pill active={tab === "All"} onClick={() => setTab("All")} count={cases.length}>
            All
          </Pill>
          <Pill active={tab === "Stale"} onClick={() => setTab("Stale")} count={stale}>
            Stale
          </Pill>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">COMPANY</th>
                <th className="px-4 py-2 font-medium">STAGE</th>
                <th className="px-4 py-2 font-medium">STATUS</th>
                <th className="px-4 py-2 font-medium">METRIC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${
                    selected === c.id ? "bg-secondary/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.companyName}</div>
                    <div className="text-xs text-muted-foreground">{c.contactName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">Prospect</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === "Stale" ? "danger" : c.status === "Pending" ? "warning" : "info"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.daysNoResponse}d no response</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground mt-2">{filtered.length} cases</div>
      </div>

      {selectedCase && (
        <div className="w-[340px] shrink-0 bg-card border border-border rounded-lg p-4 h-fit">
          <div className="font-semibold mb-1">{selectedCase.companyName}</div>
          <div className="text-xs text-muted-foreground mb-4">{selectedCase.contactName} · Prospect</div>
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Invitation timeline</div>
          <div className="text-sm mb-4">
            Invitation sent, {selectedCase.daysNoResponse} days ago. No response from contact yet.
          </div>
          <div className="flex gap-2">
            <Button variant="default" className="flex-1">Send Reminder</Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1">Re-send Magic Link</Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="danger" className="flex-1">Revoke Invitation</Button>
          </div>
        </div>
      )}
    </div>
  );
}
