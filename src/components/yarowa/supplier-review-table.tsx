import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
  if (suppliers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg py-12 flex flex-col items-center justify-center text-center">
        <Users size={22} className="text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No matching suppliers</p>
        <p className="text-xs text-muted-foreground">
          No suppliers match this catalogue's region and trade yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Button variant="outline" onClick={onSelectAll}>
          Select all
        </Button>
        <Button variant="outline" onClick={onDeselectAll}>
          Deselect all
        </Button>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium w-10"></th>
              <th className="px-4 py-2 font-medium">SUPPLIER</th>
              <th className="px-4 py-2 font-medium">REGION</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => onToggle(s.id)}
                    aria-label={`Include ${s.name}`}
                  />
                </td>
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td className="px-4 py-2.5">{s.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
