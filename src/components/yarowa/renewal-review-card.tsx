/**
 * @custom   Renewal awaiting review block shared by the Compliance drawer and the
 *           ticket drawer: a tinted Card header over the uploaded file as a
 *           pressable row and a Review button, so both open the same lightbox.
 *           Card has no pressable file row or review action. Composes Card and
 *           Button.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { Upload, FileText, Eye } from "lucide-react";
import type { SupplierDoc } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n-context";
import { Text } from "@/shared/ui/typography";

/*
 * The "renewal awaiting review" block shown wherever a compliance document has an
 * uploaded renewal — inside the Compliance drawer and the Dashboard ticket drawer.
 * Both the file row and the Review button open the shared DocumentLightbox, so the
 * review experience is identical no matter where the ticket was opened from.
 */
export function RenewalReviewCard({ doc, onReview }: { doc: SupplierDoc; onReview: () => void }) {
  const { t } = useI18n();
  if (!doc.renewal) return null;
  return (
    <Card size="sm" className="gap-0 rounded-lg py-0 shadow-none ring-border">
      <CardHeader className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3 py-2 [.border-b]:pb-2">
        <Upload size={14} className="text-foreground" aria-hidden="true" />
        <CardTitle className="text-sm">{t("Renewal Uploaded — Awaiting Review")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onReview}
          className="h-auto w-full justify-start gap-3 rounded-md border-border p-2.5 text-left font-normal whitespace-normal hover:bg-secondary/50 dark:hover:bg-secondary/50"
        >
          <FileText size={22} className="size-[22px] shrink-0 text-medium-ink" aria-hidden="true" />
          <span className="min-w-0">
            <Text variant="label" as="span" className="block truncate">{doc.renewal.fileName}</Text>
            <span className="block text-xs text-muted-foreground">
              {doc.renewal.fileSize} · {t("Uploaded {date}", { date: doc.renewal.uploadedAt })}
            </span>
          </span>
        </Button>
        <Button variant="default" className="w-full" onClick={onReview}>
          <Eye size={14} />
          {t("Review document")}
        </Button>
      </CardContent>
    </Card>
  );
}
