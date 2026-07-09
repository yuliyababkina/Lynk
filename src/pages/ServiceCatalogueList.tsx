import { useState } from "react";
import { Upload, Users, FileSpreadsheet } from "lucide-react";
import { CATALOGUE_REGIONS, CATALOGUE_TRADES } from "../data";
import { Badge, Button } from "../ui";
import type { Catalogue, CatalogueStatus } from "../types";

const STATUS_TONE: Record<CatalogueStatus, "success" | "neutral" | "info"> = {
  Active: "success",
  Draft: "neutral",
  Upcoming: "info",
};

function confirmationLabel(c: Catalogue): string {
  if (c.status === "Draft") return "Not shared yet";
  if (c.awaitingFirstResponse) return `${c.suppliers.length} Suppliers to confirm`;
  const confirmed = c.suppliers.filter((s) => s.confirmed).length;
  return `${confirmed}/${c.suppliers.length} Suppliers Confirmed`;
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

  if (catalogues.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Service catalogues</h1>
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
            <Upload size={14} /> Upload XLS file
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
          <h1 className="text-2xl font-bold mb-1">Service catalogues</h1>
          <p className="text-sm text-muted-foreground">
            Price lists per Region and Trade, shared with suppliers for confirmation.
          </p>
        </div>
        <Button onClick={onStartCreate}>
          <Upload size={14} /> Upload XLS file
        </Button>
      </div>

      <div className="flex gap-2 mb-5">
        <select className={selectCls} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option>All regions</option>
          {CATALOGUE_REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select className={selectCls} value={trade} onChange={(e) => setTrade(e.target.value)}>
          <option>All types</option>
          {CATALOGUE_TRADES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All statuses</option>
          <option>Active</option>
          <option>Draft</option>
          <option>Upcoming</option>
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
                <div className="font-semibold">{c.name}</div>
                <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {c.versionLabel} · {c.region} · {c.trade}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users size={14} />
                {confirmationLabel(c)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
