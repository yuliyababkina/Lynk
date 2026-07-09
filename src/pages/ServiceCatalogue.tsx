import { useState } from "react";
import { CATALOGUES, PARSED_LINES, DIFF_LINES } from "../data";
import { ServiceCatalogueList } from "./ServiceCatalogueList";
import { ServiceCatalogueDetail } from "./ServiceCatalogueDetail";
import { ServiceCatalogueWizard, type WizardResult } from "./ServiceCatalogueWizard";
import type { Catalogue } from "../types";

type Mode =
  | { kind: "list" }
  | { kind: "detail"; catalogueId: string }
  | { kind: "create" }
  | { kind: "update"; catalogueId: string };

function nextVersionOf(current: string): string {
  const match = current.match(/(\d+)(?:\.(\d+))?/);
  if (!match) return "Version 2";
  return match[2] !== undefined
    ? `Version ${match[1]}.${Number(match[2]) + 1}`
    : `Version ${Number(match[1]) + 1}`;
}

export function ServiceCatalogue({ initialSelectedId }: { initialSelectedId?: string | null }) {
  const [catalogues, setCatalogues] = useState<Catalogue[]>(CATALOGUES);
  const [mode, setMode] = useState<Mode>(() =>
    initialSelectedId && CATALOGUES.some((c) => c.id === initialSelectedId)
      ? { kind: "detail", catalogueId: initialSelectedId }
      : { kind: "list" }
  );

  function handleCreateFinish(result: WizardResult) {
    const id = `cat-${Date.now()}`;
    const newCatalogue: Catalogue = {
      id,
      name: result.name,
      trade: result.trade,
      region: result.region,
      status: result.publish ? "Active" : "Draft",
      versionLabel: result.publish ? "Version 1 (2027)" : "Version 1 (draft)",
      currentVersion: "Version 1",
      awaitingFirstResponse: true,
      validFrom: result.validFrom,
      validTo: result.validTo,
      responseModel: result.responseModel,
      services: PARSED_LINES.map(({ change: _change, previousRate: _prev, ...line }) => line),
      versions: [
        {
          version: "Version 1",
          publishedAt: result.publish ? "Today" : "—",
          note: result.publish ? "Initial catalogue" : "Draft, not yet shared",
        },
      ],
      suppliers: result.suppliers.map((s) => ({ ...s, confirmed: false })),
    };
    setCatalogues([newCatalogue, ...catalogues]);
    setMode(result.publish ? { kind: "detail", catalogueId: id } : { kind: "list" });
  }

  function handleUpdateFinish(catalogueId: string) {
    setCatalogues((prev) =>
      prev.map((c) => {
        if (c.id !== catalogueId) return c;
        const next = nextVersionOf(c.currentVersion);
        return {
          ...c,
          currentVersion: next,
          versionLabel: `${next} (2027)`,
          awaitingFirstResponse: false,
          versions: [{ version: next, publishedAt: "Today", note: "New version published" }, ...c.versions],
          suppliers: c.suppliers.map((s) => ({ ...s, confirmed: false })),
          services: DIFF_LINES.filter((l) => l.change !== "removed").map(
            ({ change: _change, previousRate: _prev, ...line }) => line
          ),
        };
      })
    );
    setMode({ kind: "detail", catalogueId });
  }

  if (mode.kind === "create") {
    return (
      <ServiceCatalogueWizard
        mode="create"
        onCancel={() => setMode({ kind: "list" })}
        onFinish={handleCreateFinish}
      />
    );
  }

  if (mode.kind === "update") {
    const catalogue = catalogues.find((c) => c.id === mode.catalogueId);
    if (!catalogue) {
      setMode({ kind: "list" });
      return null;
    }
    return (
      <ServiceCatalogueWizard
        mode="update"
        catalogue={catalogue}
        onCancel={() => setMode({ kind: "detail", catalogueId: mode.catalogueId })}
        onFinish={() => handleUpdateFinish(mode.catalogueId)}
      />
    );
  }

  if (mode.kind === "detail") {
    const catalogue = catalogues.find((c) => c.id === mode.catalogueId);
    if (!catalogue) {
      setMode({ kind: "list" });
      return null;
    }
    return (
      <ServiceCatalogueDetail
        key={`${catalogue.id}-${catalogue.currentVersion}`}
        catalogue={catalogue}
        onBack={() => setMode({ kind: "list" })}
        onStartUpdate={() => setMode({ kind: "update", catalogueId: catalogue.id })}
      />
    );
  }

  return (
    <ServiceCatalogueList
      catalogues={catalogues}
      onOpenCatalogue={(id) => setMode({ kind: "detail", catalogueId: id })}
      onStartCreate={() => setMode({ kind: "create" })}
    />
  );
}
