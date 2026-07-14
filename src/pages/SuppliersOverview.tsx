import { useMemo, useState } from "react";
import { Search, Plus, Star } from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/yarowa/pill";
import type { Supplier } from "../types";

const complianceTone: Record<string, "success" | "warning" | "danger" | "neutral" | "purple"> = {
  "Fully Compliant": "success",
  "Pending Review": "warning",
  Blocked: "purple",
  "Action Required": "danger",
  "—": "neutral",
};

export function SuppliersOverview({
  onOpenProfile,
  initialSelectedId,
}: {
  onOpenProfile: (id: string) => void;
  initialSelectedId?: string | null;
}) {
  const { suppliers: SUPPLIERS } = useLynkData();
  const [stage, setStage] = useState<"All" | "Prospect" | "Supplier" | "Provider">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return SUPPLIERS.filter((s) => {
      if (stage !== "All" && s.stage !== stage) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [stage, query]);

  const counts = {
    All: SUPPLIERS.length,
    Prospect: SUPPLIERS.filter((s) => s.stage === "Prospect").length,
    Supplier: SUPPLIERS.filter((s) => s.stage === "Supplier").length,
    Provider: SUPPLIERS.filter((s) => s.stage === "Provider").length,
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Suppliers Overview</h1>
          <p className="text-sm text-muted-foreground">All contacts — Prospects, Suppliers, and Providers.</p>
        </div>
        <Button>
          <Plus size={14} /> Invite Supplier
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(["All", "Prospect", "Supplier", "Provider"] as const).map((s) => (
            <Pill key={s} active={stage === s} onClick={() => setStage(s)} count={counts[s]}>
              {s}
            </Pill>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-border bg-background w-56"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">COMPANY</th>
              <th className="px-4 py-2 font-medium">STAGE</th>
              <th className="px-4 py-2 font-medium">TRADE</th>
              <th className="px-4 py-2 font-medium">REGION</th>
              <th className="px-4 py-2 font-medium">TICKETS</th>
              <th className="px-4 py-2 font-medium">COMPLIANCE</th>
              <th className="px-4 py-2 font-medium">RATING</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s: Supplier) => (
              <tr
                key={s.id}
                onClick={() => onOpenProfile(s.id)}
                className={`border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50 ${
                  initialSelectedId === s.id ? "bg-secondary/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.contacts[0]?.name}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="neutral">{s.stage}</Badge>
                </td>
                <td className="px-4 py-3">{s.trade}</td>
                <td className="px-4 py-3">{s.region}</td>
                <td className="px-4 py-3">
                  {s.openTickets > 0 ? (
                    <Badge variant="warning">
                      {s.openTickets} ticket{s.openTickets > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.compliance === "—" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Badge variant={complianceTone[s.compliance]}>{s.compliance}</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.rating ? (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star size={12} className="fill-warning text-warning" />
                      {s.rating}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Showing {filtered.length} of {SUPPLIERS.length} contacts
      </div>
    </div>
  );
}
