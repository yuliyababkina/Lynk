import { useState } from "react";
import { AlertTriangle, Upload, Bell, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "../lib/utils";
import type { Catalogue } from "../types";

export function ServiceCatalogueDetail({
  catalogue,
  onBack,
  onStartUpdate,
}: {
  catalogue: Catalogue;
  onBack: () => void;
  onStartUpdate: () => void;
}) {
  const [viewingVersion, setViewingVersion] = useState<string>(catalogue.currentVersion);
  const [remindersSent, setRemindersSent] = useState(false);

  const isCurrent = viewingVersion === catalogue.currentVersion;
  const nonCompliant = catalogue.suppliers.filter((s) => !s.confirmed);

  // Past versions show a trimmed, read-only slice of the line items as mock history.
  const services = isCurrent ? catalogue.services : catalogue.services.slice(0, Math.max(3, catalogue.services.length - 3));

  return (
    <div className="p-6">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-3">
        ← All catalogues
      </button>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">{catalogue.name}</h1>
          {isCurrent ? (
            <p className="text-sm text-muted-foreground">
              Current: {catalogue.currentVersion} · {catalogue.region} · {catalogue.trade} · Valid{" "}
              {catalogue.validFrom} — {catalogue.validTo}
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Viewing {viewingVersion} (read-only) · {catalogue.region} · {catalogue.trade}
              </p>
              <button
                onClick={() => setViewingVersion(catalogue.currentVersion)}
                className="text-sm text-accent font-medium hover:underline"
              >
                ← Back to current version
              </button>
            </div>
          )}
        </div>
        {isCurrent && (
          <Button onClick={onStartUpdate}>
            <Upload size={14} /> Upload new version
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">Services</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">SERVICE</th>
                <th className="px-4 py-2 font-medium">CATEGORY</th>
                <th className="px-4 py-2 font-medium">UNIT</th>
                <th className="px-4 py-2 font-medium">RATE</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{s.service}</td>
                  <td className="px-4 py-2.5">{s.category}</td>
                  <td className="px-4 py-2.5">{s.unit}</td>
                  <td className="px-4 py-2.5">€{s.rate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Service catalogue alerts</span>
              <Badge variant={nonCompliant.length > 0 ? "danger" : "success"}>{nonCompliant.length}</Badge>
            </div>
            {nonCompliant.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success" /> All suppliers compliant
              </div>
            ) : (
              <>
                {nonCompliant.map((s) => (
                  <div key={s.id} className="px-4 py-2.5 border-b border-border flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <span className="font-medium truncate">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">Not confirmed</span>
                  </div>
                ))}
                <div className="px-4 py-3">
                  {remindersSent ? (
                    <div className="text-sm text-success-ink flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Reminders sent to {nonCompliant.length} suppliers
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => setRemindersSent(true)}>
                      <Bell size={14} /> Remind all
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">History log</div>
            {catalogue.versions.map((v) => (
              <button
                key={v.version}
                onClick={() => setViewingVersion(v.version)}
                className={cn(
                  "w-full text-left px-4 py-2.5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
                  viewingVersion === v.version && "bg-secondary/60"
                )}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{v.version}</span>
                  {v.version === catalogue.currentVersion && <Badge variant="success">Current</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {v.publishedAt} · {v.note}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
