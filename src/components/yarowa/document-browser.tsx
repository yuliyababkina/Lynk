import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, FileX, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PdfCanvas } from "@/components/yarowa/pdf-canvas";
import { docStatusMeta } from "@/lib/document-status";
import { parseDocumentInfo, type ParsedDocumentInfo } from "@/lib/pdf-metadata";
import type { DocStatus } from "@/types";
import { useI18n } from "@/lib/i18n-context";

/** Marks a value that was read from the file, not confirmed by a person. */
export function FromFileHint() {
  const { t } = useI18n();
  return (
    <span className="ml-1.5 text-[10px] text-muted-foreground" title={t("Read from the document — not yet confirmed")}>
      {t("(from file)")}
    </span>
  );
}

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
type BrowserCallbacks = {
  renderActions?: (row: DocumentBrowserRow) => React.ReactNode;
  /** Actions on the document itself (editing its details, removing it), shown
   * beside the status in the header rather than with the workflow actions. */
  renderHeaderActions?: (row: DocumentBrowserRow) => React.ReactNode;
  /** What was read out of the open document, so a caller can offer to correct
   * exactly the values shown here. `null` while nothing has been parsed. */
  onParsed?: (key: string, parsed: ParsedDocumentInfo | null) => void;
};

export function DocumentBrowser({
  rows,
  selectedKey,
  onSelect,
  renderActions,
  renderHeaderActions,
  onParsed,
  height = "h-[70vh] min-h-[440px]",
}: {
  rows: DocumentBrowserRow[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  height?: string;
} & BrowserCallbacks) {
  const { t } = useI18n();
  const selected = rows.find((r) => r.key === selectedKey) ?? rows[0];
  const idx = selected ? rows.findIndex((r) => r.key === selected.key) : -1;
  const goPrev = () => idx > 0 && onSelect(rows[idx - 1].key);
  const goNext = () => idx >= 0 && idx < rows.length - 1 && onSelect(rows[idx + 1].key);

  return (
    <div className={`flex gap-4 ${height}`}>
      {/* Left: document list */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-1.5 pr-1">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">{t("No documents.")}</p>}
        {rows.map((r) => {
          const meta = docStatusMeta(r.status);
          const active = selected?.key === r.key;
          return (
            <Button
              key={r.key}
              variant="ghost"
              onClick={() => onSelect(r.key)}
              className={`h-auto w-full flex-col items-start justify-start gap-1.5 rounded-lg px-3 py-2.5 text-left font-normal whitespace-normal ${
                active
                  ? "border-primary bg-secondary/60 hover:bg-secondary/60 dark:hover:bg-secondary/60"
                  : "border-border hover:bg-secondary/40 dark:hover:bg-secondary/40"
              }`}
            >
              {/* The document name wraps in full — a truncated name is not
                  something you can identify a compliance document by. */}
              <span className="flex items-start gap-2 w-full">
                <FileText className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium break-words">{t(r.name)}</span>
              </span>
              <Badge variant={meta.variant} className="shrink-0 ml-6">
                <meta.Icon className="size-3" />
                {t(meta.label)}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Right: preview at document width. Keyed by document (and its file), so
          the panel's own state — page count, parsed PDF info — starts fresh when
          the selection changes, instead of being reset by effects. */}
      <div className="flex-1 min-w-0 flex justify-center">
        {selected ? (
          <DocumentBrowserPanel
            key={`${selected.key}:${selected.fileUrl ?? ""}`}
            selected={selected}
            idx={idx}
            count={rows.length}
            goPrev={goPrev}
            goNext={goNext}
            renderActions={renderActions}
            renderHeaderActions={renderHeaderActions}
            onParsed={onParsed}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            {t("Select a document to preview.")}
          </div>
        )}
      </div>
    </div>
  );
}

/* The right-hand side for ONE document: header, PDF, page count and actions. */
function DocumentBrowserPanel({
  selected,
  idx,
  count,
  goPrev,
  goNext,
  renderActions,
  renderHeaderActions,
  onParsed,
}: {
  selected: DocumentBrowserRow;
  idx: number;
  count: number;
  goPrev: () => void;
  goNext: () => void;
} & BrowserCallbacks) {
  const { t } = useI18n();
  // Held in a ref so a caller passing an inline callback can't restart parsing.
  // Updated in an effect, not during render.
  const onParsedRef = useRef(onParsed);
  useEffect(() => {
    onParsedRef.current = onParsed;
  });

  const [pageInfo, setPageInfo] = useState<{ current: number; total: number } | null>(null);

  // Read type / issuer / validity out of the PDF so they show even when nobody
  // has typed them in yet. Stored (human-confirmed) values always win.
  const [parsed, setParsed] = useState<ParsedDocumentInfo | null>(null);
  const key = selected.key;
  const url = selected.fileUrl;
  useEffect(() => {
    // A new document: tell the caller nothing has been parsed from it yet.
    onParsedRef.current?.(key, null);
    if (!url) return;
    let cancelled = false;
    parseDocumentInfo(url).then((info) => {
      if (cancelled) return;
      setParsed(info);
      onParsedRef.current?.(key, info);
    });
    return () => {
      cancelled = true;
    };
  }, [key, url]);

  const info = {
    documentType: selected.documentType || parsed?.documentType,
    issuingInstitution: selected.issuingInstitution || parsed?.issuingInstitution,
    expiryDate: selected.expiryDate || parsed?.validity,
    doesNotExpire: selected.doesNotExpire || parsed?.doesNotExpire,
    // True when a value came from the file rather than a person.
    fromFile: {
      type: !selected.documentType && Boolean(parsed?.documentType),
      issuer: !selected.issuingInstitution && Boolean(parsed?.issuingInstitution),
      validity:
        !selected.expiryDate && !selected.doesNotExpire && Boolean(parsed?.validity || parsed?.doesNotExpire),
    },
  };

  return (
      <div className="w-full flex flex-col border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-2.5 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{t(selected.name)}</p>
          <p className="text-xs text-muted-foreground">
            {selected.category ? t(selected.category) : t("Document")}
          </p>
          {selected.status && info && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-2 text-xs">
              <dt className="text-muted-foreground">{t("Document type")}</dt>
              <dd>
                {info.documentType || "—"}
                {info.fromFile.type && <FromFileHint />}
              </dd>
              <dt className="text-muted-foreground">{t("Issued by")}</dt>
              <dd>
                {info.issuingInstitution || "—"}
                {info.fromFile.issuer && <FromFileHint />}
              </dd>
              <dt className="text-muted-foreground">{t("Validity")}</dt>
              <dd>
                {info.doesNotExpire ? (
                  <span className="inline-flex items-center gap-1.5 text-success-ink">
                    <ShieldCheck className="w-3 h-3" /> {t("This certificate does not expire")}
                  </span>
                ) : info.expiryDate ? (
                  t("Expires {date}", { date: info.expiryDate })
                ) : (
                  "—"
                )}
                {info.fromFile.validity && <FromFileHint />}
              </dd>
            </dl>
          )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {renderHeaderActions?.(selected)}
            {/* Status, same badge style as the list on the left */}
            {(() => {
              const m = docStatusMeta(selected.status);
              return (
                <Badge variant={m.variant} className="shrink-0">
                  <m.Icon className="w-3 h-3" />
                  {t(m.label)}
                </Badge>
              );
            })()}
          </div>
        </div>

        <PdfCanvas
          key={selected.key}
          fileUrl={selected.fileUrl}
          className="flex-1 min-h-0"
          onPageInfo={setPageInfo}
        />

        {/* Pages within the open document */}
        <div className="flex items-center justify-center py-2 border-t border-border text-xs text-muted-foreground tabular-nums">
          {selected.fileUrl && pageInfo
            ? t(
                pageInfo.total === 1 ? "{current} of {total} page" : "{current} of {total} pages",
                { current: pageInfo.current, total: pageInfo.total }
              )
            : "—"}
        </div>

        {/* Document navigation sits on the same level as the role's actions */}
        <div className="border-t border-border p-3 flex items-center justify-between gap-3">
          {/* Boundary buttons are hidden, not disabled — works for any
              number of documents, including a single one. */}
          {idx > 0 ? (
            <Button variant="outline" size="sm" className="shrink-0" title={t("Previous document")} onClick={goPrev}>
              <ChevronLeft className="w-4 h-4" /> {t("Previous")}
            </Button>
          ) : (
            <span />
          )}
          {/* Role actions, with "Next document" always furthest right. */}
          <div className="flex items-center gap-2 min-w-0">
          {renderActions ? (
            renderActions(selected)
          ) : !selected.status ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileX className="w-3.5 h-3.5" /> {t("Not yet uploaded.")}
            </span>
          ) : null}
            {idx < count - 1 && (
              <Button variant="outline" size="sm" className="shrink-0" title={t("Next document")} onClick={goNext}>
                {t("Next")} <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
  );
}
