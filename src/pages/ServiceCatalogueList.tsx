import { useState } from "react";
import { Upload, Users, FileSpreadsheet } from "lucide-react";
import { CATALOGUE_REGIONS, CATALOGUE_TRADES } from "../data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Catalogue, CatalogueStatus } from "../types";
import { useI18n } from "@/lib/i18n";
import { translateCatalogueName } from "@/lib/ticket-i18n";

const STATUS_TONE: Record<CatalogueStatus, "success" | "neutral" | "info"> = {
  Active: "success",
  Draft: "neutral",
  Upcoming: "info",
};

type Translate = (source: string, vars?: Record<string, string | number>) => string;

function confirmationLabel(c: Catalogue, tr: Translate): string {
  if (c.status === "Draft") return tr("Not shared yet");
  if (c.awaitingFirstResponse)
    return tr("{count} Suppliers to confirm", { count: c.suppliers.length });
  const confirmed = c.suppliers.filter((s) => s.confirmed).length;
  return tr("{confirmed}/{total} Suppliers Confirmed", { confirmed, total: c.suppliers.length });
}

export function ServiceCatalogueList({
  catalogues,
  onOpenCatalogue,
  onStartCreate,
}: {
  catalogues: Catalogue[];
  onOpenCatalogue: (id: string) => void;
  onStartCreate: () => void;
}) {
  const [region, setRegion] = useState("All regions");
  const [trade, setTrade] = useState("All types");
  const [status, setStatus] = useState("All statuses");
  const { t: tr } = useI18n();

  if (catalogues.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">{tr("Service catalogues")}</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <FileSpreadsheet size={26} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Create a Service catalogue</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">
            Upload a price list of services scoped by Region and Trade, then share it with your
            suppliers for confirmation.
          </p>
          <Button onClick={onStartCreate}>
            <Upload size={14} /> {tr("Upload XLS file")}
          </Button>
        </div>
      </div>
    );
  }

  const filtered = catalogues.filter(
    (c) =>
      (region === "All regions" || c.region === region) &&
      (trade === "All types" || c.trade === trade) &&
      (status === "All statuses" || c.status === status)
  );

  const selectCls = "bg-card border border-border rounded-md px-3 py-1.5 text-sm";

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">{tr("Service catalogues")}</h1>
          <p className="text-sm text-muted-foreground">
            {tr("Price lists per Region and Trade, shared with suppliers for confirmation.")}
          </p>
        </div>
        <Button onClick={onStartCreate}>
          <Upload size={14} /> {tr("Upload XLS file")}
        </Button>
      </div>

      <div className="flex gap-2 mb-5">
        {/* Option values stay the English keys the filters compare against; only
            the visible label is translated. */}
        <select className={selectCls} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="All regions">{tr("All regions")}</option>
          {CATALOGUE_REGIONS.map((r) => (
            <option key={r} value={r}>
              {tr(r)}
            </option>
          ))}
        </select>
        <select className={selectCls} value={trade} onChange={(e) => setTrade(e.target.value)}>
          <option value="All types">{tr("All types")}</option>
          {CATALOGUE_TRADES.map((t) => (
            <option key={t} value={t}>
              {tr(t)}
            </option>
          ))}
        </select>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All statuses">{tr("All statuses")}</option>
          <option value="Active">{tr("Active")}</option>
          <option value="Draft">{tr("Draft")}</option>
          <option value="Upcoming">{tr("Upcoming")}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          No catalogues match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenCatalogue(c.id)}
              className="text-left bg-card border border-border rounded-2xl p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold">{translateCatalogueName(c.name, tr)}</div>
                <Badge variant={STATUS_TONE[c.status]}>{tr(c.status)}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {c.versionLabel} · {tr(c.region)} · {tr(c.trade)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users size={14} />
                {confirmationLabel(c, tr)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
