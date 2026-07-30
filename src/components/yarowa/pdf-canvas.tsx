import { useEffect, useRef, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// "100%" in a PDF viewer means the page at 96dpi (PDF points are 72dpi).
const SCALE_100 = 96 / 72;

/*
 * Inline PDF preview rendered with pdf.js to <canvas>, so it works in every
 * environment — including embedded/headless browser panes that lack a native
 * PDF plugin. Fills its container; scrolls when the document is taller.
 */
export function PdfCanvas({ fileUrl, className }: { fileUrl?: string; className?: string }) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const task = pdfjsLib.getDocument({ url: fileUrl });

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
  }, [fileUrl]);

  if (!fileUrl) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground", className)}>
        <FileText className="w-8 h-8 opacity-40" />
        No file uploaded for this document.
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-auto bg-secondary/40 p-4", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading document…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Couldn't render the preview.</span>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Open in a new tab
          </a>
        </div>
      )}
      <div ref={pagesRef} className="flex flex-col items-center gap-4" />
    </div>
  );
}
