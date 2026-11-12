import { useState } from "react";
import { Upload, Users, FileSpreadsheet } from "lucide-react";
import { CATALOGUE_REGIONS, CATALOGUE_TRADES } from "../data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Catalogue, CatalogueStatus } from "../types";
import { useI18n } from "@/lib/i18n-context";
import { translateCatalogueName } from "@/lib/ticket-i18n";
import { Heading } from "@/shared/ui/typography";

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
        <Heading level={1} className="mb-6">{tr("Service catalogues")}</Heading>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <FileSpreadsheet size={26} className="text-muted-foreground" />
          </div>
          <Heading level={2} className="mb-1">{tr("Create a Service catalogue")}</Heading>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">
            {tr("Upload a price list of services scoped by Region and Trade, then share it with your suppliers for confirmation.")}
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

  // Overrides for the inner <select> of NativeSelect: keeps the compact filter look.
  const selectCls =
    "[&_select]:h-auto [&_select]:rounded-md [&_select]:border-border [&_select]:bg-card [&_select]:py-1.5 [&_select]:pl-3";

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Heading level={1} className="mb-1">{tr("Service catalogues")}</Heading>
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
        <NativeSelect className={selectCls} value={region} onChange={(e) => setRegion(e.target.value)}>
          <NativeSelectOption value="All regions">{tr("All regions")}</NativeSelectOption>
          {CATALOGUE_REGIONS.map((r) => (
            <NativeSelectOption key={r} value={r}>
              {tr(r)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect className={selectCls} value={trade} onChange={(e) => setTrade(e.target.value)}>
          <NativeSelectOption value="All types">{tr("All types")}</NativeSelectOption>
          {CATALOGUE_TRADES.map((t) => (
            <NativeSelectOption key={t} value={t}>
              {tr(t)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <NativeSelectOption value="All statuses">{tr("All statuses")}</NativeSelectOption>
          <NativeSelectOption value="Active">{tr("Active")}</NativeSelectOption>
          <NativeSelectOption value="Draft">{tr("Draft")}</NativeSelectOption>
          <NativeSelectOption value="Upcoming">{tr("Upcoming")}</NativeSelectOption>
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          {tr("No catalogues match the selected filters.")}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Button
              key={c.id}
              variant="ghost"
              onClick={() => onOpenCatalogue(c.id)}
              className="h-auto flex-col items-stretch justify-start gap-0 rounded-2xl border-border bg-card p-4 text-left font-normal leading-normal whitespace-normal hover:border-accent hover:bg-card dark:hover:bg-card"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold">{translateCatalogueName(c.name, tr)}</div>
                <Badge variant={STATUS_TONE[c.status]}>{tr(c.status)}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {c.versionLabel} · {tr(c.region)} · {tr(c.trade)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users size={14} className="size-3.5" />
                {confirmationLabel(c, tr)}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
