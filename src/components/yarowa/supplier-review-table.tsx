import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";

export interface ReviewSupplier {
  id: string;
  name: string;
  region: string;
}

/*
 * Supplier list for the Distribution step. The Principal reviews the
 * auto-matched suppliers and excludes any before sharing. Includes
 * select-all / deselect-all controls and per-row checkboxes.
 */
export function SupplierReviewTable({
  suppliers,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: {
  suppliers: ReviewSupplier[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const { t } = useI18n();
  if (suppliers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg py-12 flex flex-col items-center justify-center text-center">
        <Users size={22} className="text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{t("No matching suppliers")}</p>
        <p className="text-xs text-muted-foreground">
          {t("No suppliers match this catalogue's region and trade yet.")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Button variant="outline" onClick={onSelectAll}>
          {t("Select all")}
        </Button>
        <Button variant="outline" onClick={onDeselectAll}>
          {t("Deselect all")}
        </Button>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="text-xs text-muted-foreground border-border hover:bg-transparent">
              <TableHead className="h-auto w-10 px-4 py-2 text-muted-foreground"></TableHead>
              <TableHead className="h-auto px-4 py-2 text-muted-foreground">{t("SUPPLIER")}</TableHead>
              <TableHead className="h-auto px-4 py-2 text-muted-foreground">{t("REGION")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id} className="border-border hover:bg-transparent">
                <TableCell className="px-4 py-2.5 whitespace-normal [&:has([role=checkbox])]:pr-4">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => onToggle(s.id)}
                    aria-label={t("Include {supplier}", { supplier: s.name })}
                  />
                </TableCell>
                <TableCell className="px-4 py-2.5 whitespace-normal font-medium">{s.name}</TableCell>
                <TableCell className="px-4 py-2.5 whitespace-normal">{t(s.region)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
