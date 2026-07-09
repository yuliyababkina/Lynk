import { useEffect } from "react";
import { X, FileText } from "lucide-react";
import type { SupplierDoc } from "@/types";
import { Button } from "@/components/ui/button";

/*
 * Full-screen lightbox that previews an uploaded renewal document at large size
 * and hosts the Accept / Reject decision. Rendered once at the app root and fed a
 * doc from whichever surface triggered it (Compliance drawer or Dashboard ticket),
 * so the same document and the same actions appear everywhere.
 */
export function DocumentLightbox({
  doc,
  onClose,
  onDecision,
}: {
  doc: SupplierDoc;
  onClose: () => void;
  onDecision: (decision: "accept" | "reject") => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!doc.renewal) return null;
  const acceptLabel = doc.status === "blocked" ? "Accept & Reactivate Supplier" : "Accept & Replace";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${doc.renewal.fileName}`}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <FileText size={18} className="text-medium-ink shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{doc.renewal.fileName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {doc.renewal.fileSize} · Uploaded {doc.renewal.uploadedAt} · {doc.renewal.uploadedBy}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-secondary/40 p-6">
          <DocumentPreview doc={doc} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Review the uploaded renewal, then accept or reject it.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDecision("reject")}
            >
              Reject
            </Button>
            <Button variant="success" onClick={() => onDecision("accept")}>
              {acceptLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// A faux paper document so the lightbox reads like a real PDF preview.
function DocumentPreview({ doc }: { doc: SupplierDoc }) {
  const ref = doc.id.replace(/[^0-9]/g, "").padStart(4, "0");
  return (
    <div className="mx-auto w-full max-w-[540px] aspect-[1/1.3] bg-white text-slate-900 shadow-md rounded-sm p-10 flex flex-col">
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">{doc.supplierName}</div>
          <div className="text-xs text-slate-500">{doc.trade}</div>
        </div>
        <div className="text-right text-[11px]">
          <div className="font-semibold text-slate-600 uppercase tracking-wide">Certificate</div>
          <div className="text-slate-400">{doc.documentCategory}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-xl font-bold leading-tight">{doc.documentName}</div>
        <div className="text-sm text-slate-500 mt-1">Renewal — valid from {doc.expiryDate}</div>
      </div>

      <div className="mt-8 space-y-2.5">
        {[100, 94, 97, 68, 90, 62, 84].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-slate-100" style={{ width: `${w}%` }} />
        ))}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-slate-400">Reference no.</div>
          <div className="font-medium">DOC-2026-{ref}</div>
        </div>
        <div>
          <div className="text-slate-400">Coverage</div>
          <div className="font-medium">€5,000,000</div>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between pt-8">
        <div>
          <div className="h-px w-32 bg-slate-300" />
          <div className="text-xs text-slate-500 mt-1">Authorised signature</div>
        </div>
        <div className="size-16 rounded-full border-2 border-emerald-500/40 text-emerald-600/70 grid place-items-center text-[9px] font-bold text-center leading-tight rotate-[-8deg]">
          RENEWED
          <br />
          2026
        </div>
      </div>
    </div>
  );
}
