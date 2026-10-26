import { useEffect, useState } from "react";
import { CATALOGUE_REGIONS, CATALOGUE_TRADES, PARSED_LINES, DIFF_LINES } from "../data";
import { cn } from "../lib/utils";
import { WizardStepper } from "@/components/yarowa/wizard-stepper";
import { useI18n } from "@/lib/i18n";
import { FileUploadCard } from "@/components/yarowa/file-upload-card";
import { CataloguePreviewTable } from "@/components/yarowa/catalogue-preview-table";
import { SupplierReviewTable } from "@/components/yarowa/supplier-review-table";
import { BottomActionBar } from "@/components/yarowa/bottom-action-bar";
import type { Catalogue, ResponseModel } from "../types";

const STEPS = ["Upload", "Parsing", "Preview", "Details", "Distribution"] as const;
type Step = (typeof STEPS)[number];

// Parsing is a transient loading state, not a numbered step in the header.
const VISIBLE_STEPS = ["Upload", "Preview", "Details", "Distribution"] as const;

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

/* `label` is the English source; the value beside it is a count or a piece of
   reference data the caller has already translated. */
function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { t } = useI18n();
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex-1">
      <div className="text-xs text-muted-foreground mb-1">{t(label)}</div>
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
  const { t } = useI18n();
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
  const title = isUpdate
    ? t("Upload new version — {catalogue}", { catalogue: catalogue?.name ?? "" })
    : t("Create a Service catalogue");

  function toggleSupplier(id: string) {
    setSelectedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
        ← {t("Cancel and go back")}
      </button>
      <h1 className="text-2xl font-bold mb-6 text-center">{title}</h1>
      <div className="mb-8">
        <WizardStepper
          steps={VISIBLE_STEPS}
          current={step === "Parsing" ? "Preview" : step}
          onStepClick={(s) => setStep(s as Step)}
        />
      </div>

      {step === "Upload" && (
        <div className="max-w-lg mx-auto">
          <FileUploadCard
            /* FileUploadCard translates what it is given, so the English
               source travels down as the key. */
            description={
              isUpdate
                ? "Upload the updated price list. It will be compared against the current active version."
                : "Drag an XLS file here, or choose one from your computer."
            }
            buttonLabel={isUpdate ? "Upload updated file" : "Upload XLS file"}
            onUpload={() => setStep("Parsing")}
          />
        </div>
      )}

      {step === "Parsing" && (
        <FileUploadCard
          loading
          loadingLabel={isUpdate ? "Comparing with current version…" : "Parsing file…"}
          loadingFilename={isUpdate ? "services_painting_2027.xlsx" : "services_painting.xlsx"}
        />
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
                <SummaryTile label="Trades detected" value={`1 · ${t("Painting")}`} />
                <SummaryTile label="Regions detected" value={`1 · ${t("Bavaria")}`} />
              </>
            )}
          </div>
          <div className="mb-6">
            <CataloguePreviewTable lines={lines} showDiff={isUpdate} />
          </div>
          <BottomActionBar
            onBack={() => setStep("Upload")}
            onPrimary={() => setStep("Details")}
            primaryLabel="Next"
          />
        </div>
      )}

      {step === "Details" && (
        <div>
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4 max-w-lg mx-auto">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">{t("Name")}</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("e.g. Catalog 5 Painting South")}
                disabled={isUpdate}
              />
            </div>
            {nextVersion && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {t("New version")}
                </label>
                <input className={cn(inputCls, "bg-secondary/50")} value={nextVersion} readOnly />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{t("Region")}</label>
                <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
                  {CATALOGUE_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {t(r)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{t("Trade")}</label>
                <select className={inputCls} value={trade} onChange={(e) => setTrade(e.target.value)}>
                  {CATALOGUE_TRADES.map((tradeOption) => (
                    <option key={tradeOption} value={tradeOption}>
                      {t(tradeOption)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {t("Validity period")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className={inputCls} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                <input type="date" className={inputCls} value={validTo} onChange={(e) => setValidTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                {t("Supplier response model")}
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="response-model"
                    className="mt-0.5 accent-primary"
                    checked={responseModel === "actively-agree"}
                    onChange={() => setResponseModel("actively-agree")}
                  />
                  <span>
                    <span className="font-medium">{t("Actively agree")}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t("Suppliers must explicitly confirm the catalogue before it applies to them.")}
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="response-model"
                    className="mt-0.5 accent-primary"
                    checked={responseModel === "actively-disagree"}
                    onChange={() => setResponseModel("actively-disagree")}
                  />
                  <span>
                    <span className="font-medium">{t("Actively disagree")}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t("Silence counts as acceptance; suppliers must explicitly opt out.")}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="max-w-lg mx-auto">
            <BottomActionBar
              onBack={() => setStep("Preview")}
              onPrimary={() => setStep("Distribution")}
              primaryLabel="Next"
            />
          </div>
        </div>
      )}

      {step === "Distribution" && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {isUpdate
              ? t("Suppliers linked to this catalogue will be notified to re-confirm {version}.", {
                  version: nextVersion ?? t("the new version"),
                })
              : t("Suppliers matched automatically by {region} + {trade}. Untick any you want to exclude.", {
                  region: t(region),
                  trade: t(trade),
                })}
          </p>
          <div className="mb-6">
            <SupplierReviewTable
              suppliers={supplierPool}
              selected={selectedSuppliers}
              onToggle={toggleSupplier}
              onSelectAll={() => setSelectedSuppliers(new Set(supplierPool.map((s) => s.id)))}
              onDeselectAll={() => setSelectedSuppliers(new Set())}
            />
          </div>
          <BottomActionBar
            onBack={() => setStep("Details")}
            showSaveDraft={!isUpdate}
            onSaveDraft={() => finish(false)}
            onPrimary={() => finish(true)}
            primaryLabel={isUpdate ? "Publish & notify suppliers" : "Publish & share with suppliers"}
          />
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
