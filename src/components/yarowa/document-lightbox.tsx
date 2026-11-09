import { useEffect } from "react";
import { X, FileText } from "lucide-react";
import type { SupplierDoc } from "@/types";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!doc.renewal) return null;
  const acceptLabel =
    doc.status === "blocked" ? t("Accept & Reactivate Supplier") : t("Accept & Replace");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-scrim/50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Review {file}", { file: doc.renewal.fileName })}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <FileText size={18} className="text-medium-ink shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{doc.renewal.fileName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {doc.renewal.fileSize} · {t("Uploaded {date}", { date: doc.renewal.uploadedAt })} ·{" "}
              {doc.renewal.uploadedBy}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("Close")}
            className="text-muted-foreground shrink-0"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto bg-secondary/40 p-6">
          <DocumentPreview doc={doc} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {t("Review the uploaded renewal, then accept or reject it.")}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDecision("reject")}
            >
              {t("Reject")}
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

/*
 * A faux paper document so the lightbox reads like a real PDF preview.
 *
 * Its wording stays as authored, like the names of uploaded files: this stands
 * in for the supplier's own certificate, which arrives in whatever language it
 * was issued in. The chrome around it — header, hint, decision buttons —
 * translates.
 */
// Static width classes, not a style prop: Tailwind needs to see each one in source.
const LINE_WIDTHS = ["w-full", "w-[94%]", "w-[97%]", "w-[68%]", "w-[90%]", "w-[62%]", "w-[84%]"];

function DocumentPreview({ doc }: { doc: SupplierDoc }) {
  const ref = doc.id.replace(/[^0-9]/g, "").padStart(4, "0");
  return (
    <div className="mx-auto w-full max-w-[540px] aspect-[1/1.3] bg-paper text-paper-foreground shadow-md rounded-sm p-10 flex flex-col">
      <div className="flex items-start justify-between border-b border-paper-border pb-4">
        <div>
          <div className="text-lg font-bold tracking-tight">{doc.supplierName}</div>
          <div className="text-xs text-paper-muted">{doc.trade}</div>
        </div>
        <div className="text-right text-[11px]">
          <div className="font-semibold text-paper-secondary uppercase tracking-wide">Certificate</div>
          <div className="text-paper-subtle">{doc.documentCategory}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-xl font-bold leading-tight">{doc.documentName}</div>
        <div className="text-sm text-paper-muted mt-1">Renewal — valid from {doc.expiryDate}</div>
      </div>

      <div className="mt-8 space-y-2.5">
        {LINE_WIDTHS.map((w, i) => (
          <div key={i} className={`h-2.5 rounded bg-paper-tint ${w}`} />
        ))}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-paper-subtle">Reference no.</div>
          <div className="font-medium">DOC-2026-{ref}</div>
        </div>
        <div>
          <div className="text-paper-subtle">Coverage</div>
          <div className="font-medium">€5,000,000</div>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between pt-8">
        <div>
          <div className="h-px w-32 bg-paper-rule" />
          <div className="text-xs text-paper-muted mt-1">Authorised signature</div>
        </div>
        <div className="size-16 rounded-full border-2 border-paper-stamp/40 text-paper-stamp-ink/70 grid place-items-center text-[9px] font-bold text-center leading-tight rotate-[-8deg]">
          RENEWED
          <br />
          2026
        </div>
      </div>
    </div>
  );
}
