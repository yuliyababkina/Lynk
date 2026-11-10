import { useState } from "react";
import { AlertTriangle, Upload, Bell, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "../lib/utils";
import type { Catalogue } from "../types";
import { useI18n } from "@/lib/i18n-context";
import { translateCatalogueName } from "@/lib/ticket-i18n";

export function ServiceCatalogueDetail({
  catalogue,
  onBack,
  onStartUpdate,
}: {
  catalogue: Catalogue;
  onBack: () => void;
  onStartUpdate: () => void;
}) {
  const { t } = useI18n();
  const [viewingVersion, setViewingVersion] = useState<string>(catalogue.currentVersion);
  const [remindersSent, setRemindersSent] = useState(false);

  const isCurrent = viewingVersion === catalogue.currentVersion;
  const nonCompliant = catalogue.suppliers.filter((s) => !s.confirmed);

  // Past versions show a trimmed, read-only slice of the line items as mock history.
  const services = isCurrent ? catalogue.services : catalogue.services.slice(0, Math.max(3, catalogue.services.length - 3));

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-3 h-auto border-0 p-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
      >
        ← All catalogues
      </Button>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">{translateCatalogueName(catalogue.name, t)}</h1>
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
              <Button
                variant="ghost"
                onClick={() => setViewingVersion(catalogue.currentVersion)}
                className="h-auto border-0 p-0 text-sm font-medium text-accent hover:bg-transparent hover:text-accent hover:underline dark:hover:bg-transparent"
              >
                ← Back to current version
              </Button>
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
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">{t("Services")}</div>
          <Table>
            <TableHeader>
              <TableRow className="text-xs border-border hover:bg-transparent">
                <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("SERVICE")}</TableHead>
                <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("CATEGORY")}</TableHead>
                <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("UNIT")}</TableHead>
                <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("RATE")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id} className="border-border hover:bg-transparent">
                  <TableCell className="px-4 py-2.5 whitespace-normal font-medium">{s.service}</TableCell>
                  <TableCell className="px-4 py-2.5 whitespace-normal">{s.category}</TableCell>
                  <TableCell className="px-4 py-2.5 whitespace-normal">{s.unit}</TableCell>
                  <TableCell className="px-4 py-2.5 whitespace-normal">€{s.rate.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">{t("Service catalogue alerts")}</span>
              <Badge variant={nonCompliant.length > 0 ? "danger" : "success"}>{nonCompliant.length}</Badge>
            </div>
            {nonCompliant.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success" /> {t("All suppliers compliant")}
              </div>
            ) : (
              <>
                {nonCompliant.map((s) => (
                  <div key={s.id} className="px-4 py-2.5 border-b border-border flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <span className="font-medium truncate">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">{t("Not confirmed")}</span>
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
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">{t("History log")}</div>
            {catalogue.versions.map((v) => (
              <Button
                key={v.version}
                variant="ghost"
                onClick={() => setViewingVersion(v.version)}
                className={cn(
                  "h-auto w-full flex-col items-stretch justify-start gap-0 rounded-none border-0 border-b border-border px-4 py-2.5 text-left font-normal whitespace-normal last:border-0 hover:bg-secondary/40 dark:hover:bg-secondary/40",
                  viewingVersion === v.version && "bg-secondary/60"
                )}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{v.version}</span>
                  {v.version === catalogue.currentVersion && <Badge variant="success">{t("Current")}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {v.publishedAt} · {v.note}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
