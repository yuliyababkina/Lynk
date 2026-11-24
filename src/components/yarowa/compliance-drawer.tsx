/**
 * @custom   Right-hand panel for one compliance document: status badge, date
 *           facts, the status alert and actions, the renewal review card, and
 *           the document history timeline. The alert and actions come from the
 *           same rules as the ticket panel (documentPanel in lib/ticket-panel).
 *           Composes Badge, Button, Separator, AlertBanner, ActionCard,
 *           FactList, RenewalReviewCard and RevokeAccessDialog.
 * @approved Yuliya Babkina, 2026-11-18
 */
import { useState } from "react";
import { X, Clock, CheckCircle2, Upload, Bell, Send, Ban, FileText, type LucideIcon } from "lucide-react";
import type { SupplierDoc, ComplianceEventType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { ActionCard } from "@/components/yarowa/action-card";
import { RenewalReviewCard } from "@/components/yarowa/renewal-review-card";
import { FactList } from "@/components/yarowa/fact-list";
import { COMPLIANCE_STATUS_META, documentFacts, documentPanel } from "@/lib/ticket-panel";
import { RevokeAccessDialog } from "@/components/yarowa/revoke-access-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/shared/ui/typography";

// Document-history timeline — icon + colour per event type.
const EVENT_META: Record<ComplianceEventType, { icon: LucideIcon; color: string }> = {
  verified: { icon: CheckCircle2, color: "text-success-ink" },
  warning: { icon: Clock, color: "text-warning-ink" },
  reminder: { icon: Bell, color: "text-muted-foreground" },
  notification: { icon: Send, color: "text-medium-ink" },
  blocked: { icon: Ban, color: "text-critical-ink" },
  upload: { icon: Upload, color: "text-success-ink" },
};

export function ComplianceDrawer({
  doc,
  onClose,
  onReview,
}: {
  doc: SupplierDoc;
  onClose: () => void;
  onReview: (doc: SupplierDoc) => void;
}) {
  const { t } = useI18n();
  const status = COMPLIANCE_STATUS_META[doc.status];
  const panel = documentPanel(doc, t);
  const [revoking, setRevoking] = useState(false);

  function sendReminder() {
    toast({
      title: t("Reminder sent"),
      description: t("{supplier} was reminded to renew {document}.", {
        supplier: doc.supplierName,
        document: t(doc.documentName),
      }),
      tone: "default",
    });
    onClose();
  }

  function revoke() {
    toast({
      title: t("Supplier access revoked"),
      description: t("{supplier} is blocked from new work orders until {document} is renewed.", {
        supplier: doc.supplierName,
        document: t(doc.documentName),
      }),
      tone: "warning",
    });
    onClose();
  }

  const remind = panel.actions.find((a) => a.id === "doc-remind");
  const canRevoke = panel.actions.some((a) => a.id === "doc-revoke");

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-card h-full overflow-y-auto animate-in slide-in-from-right-6 fade-in duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Text as="div" variant="eyebrow">
              {t(doc.documentCategory)}
            </Text>
            <Heading level={3} className="mt-0.5">{t(doc.documentName)}</Heading>
            <div className="text-xs text-muted-foreground mt-0.5">
              {doc.supplierName} · {t(doc.trade)}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-auto shrink-0 border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            aria-label={t("Close")}
          >
            <X size={18} className="size-[18px]" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Badge variant={status.variant}>{t(status.label)}</Badge>

        {/* The same date facts the ticket panel shows for this document. */}
        <FactList facts={documentFacts(doc, t)} />

        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 hover:bg-secondary/50 transition-colors"
          >
            <FileText size={15} className="text-muted-foreground shrink-0" />
            <Text as="span" variant="label">{t("View attached document")}</Text>
          </a>
        )}

        {panel.alert && (
          <AlertBanner type={panel.alert.type} title={panel.alert.title}>
            {panel.alert.body}
          </AlertBanner>
        )}

        {panel.renewalReview && <RenewalReviewCard doc={doc} onReview={() => onReview(doc)} />}

        {/* Same actions as the ticket panel: the reminder first, Revoke apart
            and confirmed (only for a rejected resubmission). */}
        {remind && (
          <ActionCard
            tone="info"
            icon={Send}
            title={remind.label}
            description={
              doc.status === "rejected-resubmit"
                ? t("Ask {supplier} to correct and re-upload", { supplier: doc.supplierName })
                : t("Notify {supplier} to upload their renewal", { supplier: doc.supplierName })
            }
            onClick={sendReminder}
          />
        )}
        {canRevoke && (
          <>
            <Separator />
            <ActionCard
              tone="danger"
              icon={Ban}
              title={t("Revoke supplier access")}
              description={t("Block immediately — re-enable when document is renewed")}
              onClick={() => setRevoking(true)}
            />
            <RevokeAccessDialog
              open={revoking}
              onOpenChange={setRevoking}
              supplierName={doc.supplierName}
              onConfirm={revoke}
            />
          </>
        )}

        {/* Document history */}
        {doc.history.length > 0 && (
          <div>
            <Text as="div" variant="eyebrow" className="mb-3">
              {t("Document history")}
            </Text>
            <ol className="space-y-3">
              {doc.history.map((h, i) => {
                const meta = EVENT_META[h.type ?? "verified"];
                const EventIcon = meta.icon;
                return (
                  <li key={i} className="flex gap-2.5">
                    <EventIcon size={15} className={`shrink-0 mt-0.5 ${meta.color}`} aria-hidden="true" />
                    <div className="min-w-0">
                      {/* Timeline events come from a fixed set the backend
                          writes, so they are dictionary keys like the rest of
                          the reference data. */}
                      <div className="text-sm">{t(h.event)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {h.date} · {h.actor}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
