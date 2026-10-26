import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { diffRow, diffLabel } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import type { CatalogueLineDiff } from "@/types";

/*
 * Parsed service-catalogue lines. With `showDiff`, rows are colour-coded by
 * change state (added / changed / removed) and a CHANGE column is shown —
 * used in the update flow. Without it, a plain read-only parse preview.
 *
 * The table's chrome translates; the lines themselves don't — they are read out
 * of the supplier's own uploaded catalogue.
 */
export function CataloguePreviewTable({
  lines,
  showDiff = false,
}: {
  lines: CatalogueLineDiff[];
  showDiff?: boolean;
}) {
  const { t } = useI18n();
  if (lines.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg py-12 flex flex-col items-center justify-center text-center">
        <FileSpreadsheet size={22} className="text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{t("No rows parsed")}</p>
        <p className="text-xs text-muted-foreground">{t("The uploaded file contained no service lines.")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="px-4 py-2 font-medium">{t("SERVICE")}</th>
            <th className="px-4 py-2 font-medium">{t("CATEGORY")}</th>
            <th className="px-4 py-2 font-medium">{t("UNIT")}</th>
            <th className="px-4 py-2 font-medium">{t("RATE")}</th>
            {showDiff && <th className="px-4 py-2 font-medium">{t("CHANGE")}</th>}
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
                  {l.change === "added" && <span className={diffLabel.added}>{t("Added")}</span>}
                  {l.change === "changed" && <span className={diffLabel.changed}>{t("Changed")}</span>}
                  {l.change === "removed" && (
                    <span className={cn(diffLabel.removed, "no-underline")}>{t("Removed")}</span>
                  )}
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
