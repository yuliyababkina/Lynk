import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diffRow, diffLabel } from "@/lib/theme";
import { useI18n } from "@/lib/i18n-context";
import { Text } from "@/shared/ui/typography";
import type { CatalogueLineDiff } from "@/types";

/* TableRow tints on hover by default; these keep each row's own diff colour
   (diffRow in lib/theme) instead. Literal strings so Tailwind can read them. */
const DIFF_HOVER: Record<CatalogueLineDiff["change"], string> = {
  added: "hover:bg-success/10",
  changed: "hover:bg-warning/10",
  removed: "hover:bg-destructive/10",
  unchanged: "hover:bg-transparent",
};

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
        <Text variant="label">{t("No rows parsed")}</Text>
        <p className="text-xs text-muted-foreground">{t("The uploaded file contained no service lines.")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="text-xs border-border hover:bg-transparent">
            <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("SERVICE")}</TableHead>
            <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("CATEGORY")}</TableHead>
            <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("UNIT")}</TableHead>
            <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("RATE")}</TableHead>
            {showDiff && <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("CHANGE")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l) => (
            <TableRow
              key={l.id}
              className={cn(
                "border-border",
                showDiff ? DIFF_HOVER[l.change] : "hover:bg-transparent",
                showDiff && diffRow[l.change]
              )}
            >
              <TableCell className="px-4 py-2.5 whitespace-normal font-medium">{l.service}</TableCell>
              <TableCell className="px-4 py-2.5 whitespace-normal">{l.category}</TableCell>
              <TableCell className="px-4 py-2.5 whitespace-normal">{l.unit}</TableCell>
              <TableCell className="px-4 py-2.5 whitespace-normal">
                €{l.rate.toFixed(2)}
                {showDiff && l.change === "changed" && l.previousRate !== undefined && (
                  <span className="text-xs text-muted-foreground line-through ml-2">
                    €{l.previousRate.toFixed(2)}
                  </span>
                )}
              </TableCell>
              {showDiff && (
                <TableCell className="px-4 py-2.5 whitespace-normal">
                  <Text variant="label" as="span">
                    {l.change === "added" && <span className={diffLabel.added}>{t("Added")}</span>}
                    {l.change === "changed" && <span className={diffLabel.changed}>{t("Changed")}</span>}
                    {l.change === "removed" && (
                      <span className={cn(diffLabel.removed, "no-underline")}>{t("Removed")}</span>
                    )}
                    {l.change === "unchanged" && <span className="text-muted-foreground">—</span>}
                  </Text>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
