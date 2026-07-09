import { Upload, FileText, Eye } from "lucide-react";
import type { SupplierDoc } from "@/types";
import { Button } from "@/components/ui/button";

/*
 * The "renewal awaiting review" block shown wherever a compliance document has an
 * uploaded renewal — inside the Compliance drawer and the Dashboard ticket drawer.
 * Both the file row and the Review button open the shared DocumentLightbox, so the
 * review experience is identical no matter where the ticket was opened from.
 */
export function RenewalReviewCard({ doc, onReview }: { doc: SupplierDoc; onReview: () => void }) {
  if (!doc.renewal) return null;
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-secondary/60 border-b border-border px-3 py-2">
        <Upload size={14} className="text-foreground" aria-hidden="true" />
        <span className="text-xs font-semibold">Renewal Uploaded — Awaiting Review</span>
      </div>
      <div className="p-3 space-y-3">
        <button
          type="button"
          onClick={onReview}
          className="w-full text-left flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-secondary/50"
        >
          <FileText size={22} className="shrink-0 text-medium-ink" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">{doc.renewal.fileName}</span>
            <span className="block text-xs text-muted-foreground">
              {doc.renewal.fileSize} · Uploaded {doc.renewal.uploadedAt}
            </span>
          </span>
        </button>
        <Button variant="default" className="w-full" onClick={onReview}>
          <Eye size={14} />
          Review document
        </Button>
      </div>
    </div>
  );
}
