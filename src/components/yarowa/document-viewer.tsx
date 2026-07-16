import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { SupplierDoc } from "@/types";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// "100%" in a PDF viewer means the page at 96dpi (PDF points are 72dpi).
const SCALE_100 = 96 / 72;

/*
 * Full-screen lightbox that previews an attached document's PDF at 100% scale.
 * Rendered with pdf.js to a canvas so it works everywhere — including embedded
 * browser panes that lack a native PDF plugin. View-only; the renewal
 * Accept/Reject flow lives in DocumentLightbox instead.
 */
export function DocumentViewer({ doc, onClose }: { doc: SupplierDoc; onClose: () => void }) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!doc.fileUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const task = pdfjsLib.getDocument({ url: doc.fileUrl });

    (async () => {
      try {
        const pdf = await task.promise;
        const container = pagesRef.current;
        if (cancelled || !container) return;
        container.replaceChildren();
        const dpr = window.devicePixelRatio || 1;

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const viewport = page.getViewport({ scale: SCALE_100 });
          const canvas = document.createElement("canvas");
          canvas.className = "bg-white shadow-md mx-auto max-w-full h-auto";
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          container.appendChild(canvas);
          await page.render({
            canvasContext: ctx,
            viewport,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
          }).promise;
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load document");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [doc.fileUrl]);

  if (!doc.fileUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${doc.documentName}`}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{doc.documentName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {doc.supplierName} · {doc.documentCategory}
              {doc.expiryDate ? ` · Expires ${doc.expiryDate}` : ""}
            </div>
          </div>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-auto bg-secondary/40 p-4 sm:p-6">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              Loading document…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Couldn't render the preview.</span>
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Open in a new tab
              </a>
            </div>
          )}
          <div ref={pagesRef} className="flex flex-col items-center gap-4" />
        </div>
      </div>
    </div>
  );
}
