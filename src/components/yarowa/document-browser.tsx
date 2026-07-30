import { ChevronLeft, ChevronRight, FileText, FileX, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";
import { docStatusMeta } from "@/lib/document-status";
import type { DocStatus } from "@/types";

export interface DocumentBrowserRow {
  key: string;
  name: string;
  category?: string;
  /** undefined = expected but not uploaded yet ("Missing"). */
  status?: DocStatus;
  statusNote?: string;
  fileUrl?: string;
  documentType?: string;
  issuingInstitution?: string;
  expiryDate?: string;
  doesNotExpire?: boolean;
}

/*
 * Document list + full preview, shared by the Procurement Manager review, the
 * supplier portal, and the prospect onboarding wizard — so every role browses
 * documents the same way and sees the same status vocabulary. Role-specific
 * actions (approve/decline, upload/replace) go in the `renderActions` slot.
 */
export function DocumentBrowser({
  rows,
  selectedKey,
  onSelect,
  renderActions,
  height = "h-[70vh] min-h-[440px]",
}: {
  rows: DocumentBrowserRow[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  renderActions?: (row: DocumentBrowserRow) => React.ReactNode;
  height?: string;
}) {
  const selected = rows.find((r) => r.key === selectedKey) ?? rows[0];
  const idx = selected ? rows.findIndex((r) => r.key === selected.key) : -1;
  const goPrev = () => idx > 0 && onSelect(rows[idx - 1].key);
  const goNext = () => idx >= 0 && idx < rows.length - 1 && onSelect(rows[idx + 1].key);

  return (
    <div className={`flex gap-4 ${height}`}>
      {/* Left: document list */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-1.5 pr-1">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No documents.</p>}
        {rows.map((r) => {
          const meta = docStatusMeta(r.status);
          const active = selected?.key === r.key;
          return (
            <button
              key={r.key}
              onClick={() => onSelect(r.key)}
              className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                active ? "border-primary bg-secondary/60" : "border-border hover:bg-secondary/40"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{r.name}</span>
              </span>
              <Badge variant={meta.variant as any} className="shrink-0">
                <meta.Icon className="w-3 h-3" />
                {meta.label}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Right: preview at document width */}
      <div className="flex-1 min-w-0 flex justify-center">
        {selected ? (
          <div className="w-full flex flex-col border border-border rounded-xl overflow-hidden bg-card">
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-sm font-semibold truncate">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.category || "Document"}</p>
              {selected.status && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2 text-xs">
                  <dt className="text-muted-foreground">Document type</dt>
                  <dd>{selected.documentType || "—"}</dd>
                  <dt className="text-muted-foreground">Issued by</dt>
                  <dd>{selected.issuingInstitution || "—"}</dd>
                  <dt className="text-muted-foreground">Validity</dt>
                  <dd>
                    {selected.doesNotExpire ? (
                      <span className="flex items-center gap-1.5 text-success-ink">
                        <ShieldCheck className="w-3 h-3" /> This certificate does not expire
                      </span>
                    ) : selected.expiryDate ? (
                      `Expires ${selected.expiryDate}`
                    ) : (
                      "—"
                    )}
                  </dd>
                </dl>
              )}
            </div>

            <PdfCanvas fileUrl={selected.fileUrl} className="flex-1 min-h-0" />

            <div className="flex items-center justify-center gap-3 py-2 border-t border-border">
              <Button variant="outline" size="icon" disabled={idx <= 0} onClick={goPrev} aria-label="Previous document" title="Previous document">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums w-14 text-center">
                {idx + 1} / {rows.length}
              </span>
              <Button variant="outline" size="icon" disabled={idx >= rows.length - 1} onClick={goNext} aria-label="Next document" title="Next document">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {renderActions ? (
              renderActions(selected)
            ) : !selected.status ? (
              <div className="border-t border-border p-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileX className="w-3.5 h-3.5" /> Not yet uploaded.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a document to preview.
          </div>
        )}
      </div>
    </div>
  );
}
