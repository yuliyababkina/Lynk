import { useEffect, useState } from "react";
import { Check, Upload, Loader2 } from "lucide-react";
import { CATALOGUE_REGIONS, CATALOGUE_TRADES, PARSED_LINES, DIFF_LINES } from "../data";
import { Button } from "@/components/ui/button";
import { diffRow, diffLabel } from "@/lib/theme";
import { cn } from "../lib/utils";
import type { Catalogue, CatalogueLineDiff, ResponseModel } from "../types";

const STEPS = ["Upload", "Parsing", "Preview", "Details", "Distribution"] as const;
type Step = (typeof STEPS)[number];

// Parsing is a transient loading state, not a numbered step in the header.
const VISIBLE_STEPS = ["Upload", "Preview", "Details", "Distribution"] as const;
type VisibleStep = (typeof VISIBLE_STEPS)[number];

export interface WizardResult {
  name: string;
  region: string;
  trade: string;
  validFrom: string;
  validTo: string;
  responseModel: ResponseModel;
  suppliers: { id: string; name: string; region: string }[];
  publish: boolean;
}

function nextVersionOf(current: string): string {
  const match = current.match(/(\d+)(?:\.(\d+))?/);
  if (!match) return "Version 2";
  return match[2] !== undefined
    ? `Version ${match[1]}.${Number(match[2]) + 1}`
    : `Version ${Number(match[1]) + 1}`;
}

function Stepper({ current, onStepClick }: { current: Step; onStepClick: (s: VisibleStep) => void }) {
  // Parsing loads toward Preview, so highlight Preview while it runs.
  const activeStep: VisibleStep = current === "Parsing" ? "Preview" : current;
  const currentIdx = VISIBLE_STEPS.indexOf(activeStep);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {VISIBLE_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onStepClick(s)}
            className="flex items-center gap-2 rounded-md px-1 -mx-1 hover:opacity-70 transition-opacity"
          >
            <span
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                i < currentIdx
                  ? "bg-success border-success text-white"
                  : i === currentIdx
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground"
              )}
            >
              {i < currentIdx ? <Check size={14} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                i === currentIdx ? "font-semibold" : "text-muted-foreground"
              )}
            >
              {s}
            </span>
          </button>
          {i < VISIBLE_STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function DiffTable({ lines, showDiff }: { lines: CatalogueLineDiff[]; showDiff: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="px-4 py-2 font-medium">SERVICE</th>
            <th className="px-4 py-2 font-medium">CATEGORY</th>
            <th className="px-4 py-2 font-medium">UNIT</th>
            <th className="px-4 py-2 font-medium">RATE</th>
            {showDiff && <th className="px-4 py-2 font-medium">CHANGE</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr
              key={l.id}
              className={cn("border-b border-border last:border-0", showDiff && diffRow[l.change])}
            >
              <td className="px-4 py-2.5 font-medium">{l.service}</td>
              <td className="px-4 py-2.5">{l.category}</td>
              <td className="px-4 py-2.5">{l.unit}</td>
              <td className="px-4 py-2.5">
                €{l.rate.toFixed(2)}
                {showDiff && l.change === "changed" && l.previousRate !== undefined && (
                  <span className="text-xs text-muted-foreground line-through ml-2">
                    €{l.previousRate.toFixed(2)}
                  </span>
                )}
              </td>
              {showDiff && (
                <td className="px-4 py-2.5 text-xs font-medium">
                  {l.change === "added" && <span className={diffLabel.added}>Added</span>}
                  {l.change === "changed" && <span className={diffLabel.changed}>Changed</span>}
                  {l.change === "removed" && <span className={cn(diffLabel.removed, "no-underline")}>Removed</span>}
                  {l.change === "unchanged" && <span className="text-muted-foreground">—</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex-1">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-xl font-bold", tone)}>{value}</div>
    </div>
  );
}

export function ServiceCatalogueWizard({
  mode,
  catalogue,
  onCancel,
  onFinish,
}: {
  mode: "create" | "update";
  catalogue?: Catalogue;
  onCancel: () => void;
  onFinish: (result: WizardResult) => void;
}) {
  const isUpdate = mode === "update";
  const [step, setStep] = useState<Step>("Upload");
  const [name, setName] = useState(isUpdate ? (catalogue?.name ?? "") : "");
  const [region, setRegion] = useState(isUpdate ? (catalogue?.region ?? CATALOGUE_REGIONS[0]) : CATALOGUE_REGIONS[0]);
  const [trade, setTrade] = useState(isUpdate ? (catalogue?.trade ?? CATALOGUE_TRADES[0]) : CATALOGUE_TRADES[0]);
  const [validFrom, setValidFrom] = useState(isUpdate ? (catalogue?.validFrom ?? "") : "2027-01-01");
  const [validTo, setValidTo] = useState(isUpdate ? (catalogue?.validTo ?? "") : "2027-12-31");
  const [responseModel, setResponseModel] = useState<ResponseModel>(
    isUpdate ? (catalogue?.responseModel ?? "actively-agree") : "actively-agree"
  );

  const supplierPool = isUpdate
    ? (catalogue?.suppliers ?? [])
    : (CATALOGUES_FALLBACK_POOL as { id: string; name: string; region: string }[]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(
    () => new Set(supplierPool.map((s) => s.id))
  );

  useEffect(() => {
    if (step !== "Parsing") return;
    const t = setTimeout(() => setStep("Preview"), 1600);
    return () => clearTimeout(t);
  }, [step]);

  const lines = isUpdate ? DIFF_LINES : PARSED_LINES;
  const added = lines.filter((l) => l.change === "added").length;
  const changed = lines.filter((l) => l.change === "changed").length;
  const removed = lines.filter((l) => l.change === "removed").length;
  const categories = new Set(lines.map((l) => l.category)).size;

  const nextVersion = isUpdate && catalogue ? nextVersionOf(catalogue.currentVersion) : null;

  const inputCls = "bg-card border border-border rounded-md px-3 py-1.5 text-sm w-full";
  const title = isUpdate ? `Upload new version — ${catalogue?.name}` : "Create a Service catalogue";

  function finish(publish: boolean) {
    onFinish({
      name: name || "Untitled catalogue",
      region,
      trade,
      validFrom,
      validTo,
      responseModel,
      suppliers: supplierPool
        .filter((s) => selectedSuppliers.has(s.id))
        .map((s) => ({ id: s.id, name: s.name, region: s.region })),
      publish,
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground mb-3">
        ← Cancel and go back
      </button>
      <h1 className="text-2xl font-bold mb-6 text-center">{title}</h1>
      <Stepper current={step} onStepClick={(s) => setStep(s)} />

      {step === "Upload" && (
        <div className="max-w-lg mx-auto">
          <div className="border-2 border-dashed border-border rounded-2xl py-20 flex flex-col items-center justify-center text-center bg-card">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <Upload size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              {isUpdate
                ? "Upload the updated price list. It will be compared against the current active version."
                : "Drag an XLS file here, or choose one from your computer."}
            </p>
            <Button onClick={() => setStep("Parsing")}>
              <Upload size={14} /> {isUpdate ? "Upload updated file" : "Upload XLS file"}
            </Button>
          </div>
        </div>
      )}

      {step === "Parsing" && (
        <div className="border border-border rounded-2xl py-20 flex flex-col items-center justify-center bg-card">
          <Loader2 size={28} className="animate-spin text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            {isUpdate ? "Comparing with current version…" : "Parsing file…"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isUpdate ? "services_painting_2027.xlsx" : "services_painting.xlsx"}
          </p>
        </div>
      )}

      {step === "Preview" && (
        <div>
          <div className="flex gap-3 mb-4">
            {isUpdate ? (
              <>
                <SummaryTile label="Rows added" value={String(added)} tone="text-success-ink" />
                <SummaryTile label="Rows changed" value={String(changed)} tone="text-warning-ink" />
                <SummaryTile label="Rows removed" value={String(removed)} tone="text-critical" />
                <SummaryTile label="Total rows" value={String(lines.length)} />
              </>
            ) : (
              <>
                <SummaryTile label="Total rows" value={String(lines.length)} />
                <SummaryTile label="Categories" value={String(categories)} />
                <SummaryTile label="Trades detected" value="1 · Painting" />
                <SummaryTile label="Regions detected" value="1 · Bavaria" />
              </>
            )}
          </div>
          <DiffTable lines={lines} showDiff={isUpdate} />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("Upload")}>
              Back
            </Button>
            <Button onClick={() => setStep("Details")}>Next</Button>
          </div>
        </div>
      )}

      {step === "Details" && (
        <div>
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4 max-w-lg mx-auto">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Catalog 5 Painting South"
                disabled={isUpdate}
              />
            </div>
            {nextVersion && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">New version</label>
                <input className={cn(inputCls, "bg-secondary/50")} value={nextVersion} readOnly />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Region</label>
                <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
                  {CATALOGUE_REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Trade</label>
                <select className={inputCls} value={trade} onChange={(e) => setTrade(e.target.value)}>
                  {CATALOGUE_TRADES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Validity period</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className={inputCls} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                <input type="date" className={inputCls} value={validTo} onChange={(e) => setValidTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Supplier response model
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="response-model"
                    className="mt-0.5 accent-slate-900"
                    checked={responseModel === "actively-agree"}
                    onChange={() => setResponseModel("actively-agree")}
                  />
                  <span>
                    <span className="font-medium">Actively agree</span>
                    <span className="block text-xs text-muted-foreground">
                      Suppliers must explicitly confirm the catalogue before it applies to them.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="response-model"
                    className="mt-0.5 accent-slate-900"
                    checked={responseModel === "actively-disagree"}
                    onChange={() => setResponseModel("actively-disagree")}
                  />
                  <span>
                    <span className="font-medium">Actively disagree</span>
                    <span className="block text-xs text-muted-foreground">
                      Silence counts as acceptance; suppliers must explicitly opt out.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-between max-w-lg mx-auto">
            <Button variant="outline" onClick={() => setStep("Preview")}>
              Back
            </Button>
            <Button onClick={() => setStep("Distribution")}>Next</Button>
          </div>
        </div>
      )}

      {step === "Distribution" && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {isUpdate
              ? `Suppliers linked to this catalogue will be notified to re-confirm ${nextVersion ?? "the new version"}.`
              : `Suppliers matched automatically by ${region} + ${trade}. Untick any you want to exclude.`}
          </p>
          <div className="flex gap-2 mb-3">
            <Button variant="outline" onClick={() => setSelectedSuppliers(new Set(supplierPool.map((s) => s.id)))}>
              Select all
            </Button>
            <Button variant="outline" onClick={() => setSelectedSuppliers(new Set())}>
              Deselect all
            </Button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-2 font-medium w-10"></th>
                  <th className="px-4 py-2 font-medium">SUPPLIER</th>
                  <th className="px-4 py-2 font-medium">REGION</th>
                </tr>
              </thead>
              <tbody>
                {supplierPool.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-slate-900"
                        checked={selectedSuppliers.has(s.id)}
                        onChange={(e) => {
                          const next = new Set(selectedSuppliers);
                          if (e.target.checked) next.add(s.id);
                          else next.delete(s.id);
                          setSelectedSuppliers(next);
                        }}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium">{s.name}</td>
                    <td className="px-4 py-2.5">{s.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("Details")}>
              Back
            </Button>
            <div className="flex gap-2">
              {!isUpdate && (
                <Button variant="outline" onClick={() => finish(false)}>
                  Save as draft
                </Button>
              )}
              <Button onClick={() => finish(true)}>
                {isUpdate ? "Publish & notify suppliers" : "Publish & share with suppliers"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Supplier pool used in the create flow, where no catalogue exists yet —
// mimics the automatic Region + Trade match.
const CATALOGUES_FALLBACK_POOL = [
  { id: "riedel", name: "Riedel Fertigungen GmbH", region: "Bavaria" },
  { id: "bauparts", name: "BauParts GmbH", region: "Bavaria" },
  { id: "mueller", name: "Müller Logistik KG", region: "Bavaria" },
  { id: "werner", name: "Werner & Co KG", region: "Bavaria" },
  { id: "bauer", name: "Bauer Sanitär GmbH", region: "Bavaria" },
  { id: "novak", name: "Novak Installationstechnik", region: "Bavaria" },
];
