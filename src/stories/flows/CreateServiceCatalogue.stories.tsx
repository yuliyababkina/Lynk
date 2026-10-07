import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { WizardStepper } from "@/components/yarowa/wizard-stepper";
import { FileUploadCard } from "@/components/yarowa/file-upload-card";
import { CataloguePreviewTable } from "@/components/yarowa/catalogue-preview-table";
import { SupplierReviewTable, type ReviewSupplier } from "@/components/yarowa/supplier-review-table";
import { BottomActionBar } from "@/components/yarowa/bottom-action-bar";
import { ServiceCatalogueWizard } from "@/pages/ServiceCatalogueWizard";
import { PARSED_LINES } from "@/data";
import type { Catalogue } from "@/types";

const STEPS = ["Upload", "Preview", "Details", "Distribution"];

/* Own fixture rather than data.ts: CATALOGUES is empty now that catalogues come
   from Supabase, and a story that reads seed data breaks the moment that seed
   changes — this file failed to import at all for exactly that reason. */
const SUPPLIERS: ReviewSupplier[] = [
  { id: "cs-1", name: "Maler Rhein GmbH", region: "Nordrhein-Westfalen" },
  { id: "cs-2", name: "Farbwerk Berlin", region: "Berlin" },
  { id: "cs-3", name: "Anstrich & Putz AG", region: "Bayern" },
];

const CATALOGUE: Catalogue = {
  id: "cat-1",
  name: "Catalog 2026 Painting",
  trade: "Painting",
  region: "Nordrhein-Westfalen",
  status: "Active",
  versionLabel: "v2.1",
  currentVersion: "2.1",
  awaitingFirstResponse: false,
  validFrom: "01 Jan 2026",
  validTo: "31 Dec 2026",
  responseModel: "actively-agree",
  services: PARSED_LINES.map(({ id, service, category, unit, rate }) => ({
    id,
    service,
    category,
    unit,
    rate,
  })),
  versions: [{ version: "2.0", publishedAt: "01 Jan 2026", note: "Initial publication" }],
  suppliers: SUPPLIERS.map((s) => ({ id: s.id, name: s.name, region: s.region, confirmed: true })),
};

/*
 * "Flows" compose the real product components together exactly as the wizard
 * uses them, one story per step of Create Service Catalogue, plus the full
 * interactive wizard (create + update).
 */
function StepFrame({ current, children }: { current: string; children: React.ReactNode }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Create a Service catalogue</h1>
      <div className="mb-8">
        <WizardStepper steps={STEPS} current={current} onStepClick={fn()} />
      </div>
      {children}
    </div>
  );
}

const meta = {
  title: "Flows/Create Service Catalogue",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Step 1 — Upload. */
export const StepUpload: Story = {
  render: () => (
    <StepFrame current="Upload">
      <div className="max-w-lg mx-auto">
        <FileUploadCard onUpload={fn()} />
      </div>
    </StepFrame>
  ),
};

/** Step 2 — Preview of the parsed rows, with summary tiles above. */
export const StepPreview: Story = {
  render: () => (
    <StepFrame current="Preview">
      <div className="mb-6">
        <CataloguePreviewTable lines={PARSED_LINES} showDiff={false} />
      </div>
      <BottomActionBar onBack={fn()} onPrimary={fn()} primaryLabel="Next" />
    </StepFrame>
  ),
};

/** Step 4 — Distribution: review + exclude auto-matched suppliers. */
export const StepDistribution: Story = {
  render: () => {
    const [sel, setSel] = useState<Set<string>>(new Set(SUPPLIERS.map((s) => s.id)));
    return (
      <StepFrame current="Distribution">
        <p className="text-sm text-muted-foreground mb-3">
          Suppliers matched automatically by Bavaria + Painting. Untick any you want to exclude.
        </p>
        <div className="mb-6">
          <SupplierReviewTable
            suppliers={SUPPLIERS}
            selected={sel}
            onToggle={(id) =>
              setSel((p) => {
                const n = new Set(p);
                n.has(id) ? n.delete(id) : n.add(id);
                return n;
              })
            }
            onSelectAll={() => setSel(new Set(SUPPLIERS.map((s) => s.id)))}
            onDeselectAll={() => setSel(new Set())}
          />
        </div>
        <BottomActionBar
          onBack={fn()}
          showSaveDraft
          onSaveDraft={fn()}
          onPrimary={fn()}
          primaryLabel="Publish & share with suppliers"
        />
      </StepFrame>
    );
  },
};

/** The full create wizard, interactive end-to-end (real component). */
export const InteractiveCreate: Story = {
  render: () => (
    <ServiceCatalogueWizard mode="create" onCancel={fn()} onFinish={fn()} />
  ),
};

/** The full update wizard (diff preview, auto version, notify) — interactive. */
export const InteractiveUpdate: Story = {
  render: () => (
    <ServiceCatalogueWizard
      mode="update"
      catalogue={CATALOGUE}
      onCancel={fn()}
      onFinish={fn()}
    />
  ),
};
