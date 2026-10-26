import {
  X, ShieldAlert, XCircle, Clock, CheckCircle2, AlertTriangle,
  Upload, Bell, Send, Ban, FileText, type LucideIcon,
} from "lucide-react";
import type { SupplierDoc, DocStatus, ComplianceEventType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AlertBanner, type AlertBannerType } from "@/components/yarowa/alert-banner";
import { ActionCard } from "@/components/yarowa/action-card";
import { RenewalReviewCard } from "@/components/yarowa/renewal-review-card";
import { toast } from "@/components/yarowa/toast";
import { useI18n } from "@/lib/i18n";
import { translateStatusNote } from "@/lib/ticket-i18n";
import type { Tone } from "@/lib/tones";

// Badge-variant name per status (distinct from the ActionCard `Tone` scale).
type BadgeTone = "success" | "warning" | "orange" | "danger" | "info" | "neutral" | "purple";

const STATUS_META: Record<DocStatus, { label: string; tone: BadgeTone }> = {
  valid: { label: "Valid", tone: "success" },
  "warning-60": { label: "60-Day Warning", tone: "warning" },
  "warning-30": { label: "30-Day Auto-Notify", tone: "orange" },
  "pending-review": { label: "Pending Review", tone: "info" },
  "rejected-resubmit": { label: "Rejected — Resubmit", tone: "danger" },
  blocked: { label: "Blocked", tone: "neutral" },
};

// Status callout — icon, tint and heading that frame the "what needs attention" note.
const CALLOUT_META: Record<DocStatus, { icon: LucideIcon; title: string; className: string; iconColor: string }> = {
  blocked: { icon: ShieldAlert, title: "Supplier blocked from work orders", className: "bg-critical-soft", iconColor: "text-critical-ink" },
  "rejected-resubmit": { icon: XCircle, title: "Resubmission required", className: "bg-critical-soft", iconColor: "text-critical-ink" },
  "pending-review": { icon: Clock, title: "Awaiting your review", className: "bg-medium-soft", iconColor: "text-medium-ink" },
  "warning-60": { icon: AlertTriangle, title: "Expiring soon", className: "bg-warning-soft", iconColor: "text-warning-ink" },
  "warning-30": { icon: AlertTriangle, title: "30-day auto-notification sent", className: "bg-chart-orange-soft", iconColor: "text-chart-orange-ink" },
  valid: { icon: CheckCircle2, title: "Document valid", className: "bg-success-soft", iconColor: "text-success-ink" },
};

// Document-history timeline — icon + colour per event type.
const EVENT_META: Record<ComplianceEventType, { icon: LucideIcon; color: string }> = {
  verified: { icon: CheckCircle2, color: "text-success-ink" },
  warning: { icon: Clock, color: "text-warning-ink" },
  reminder: { icon: Bell, color: "text-muted-foreground" },
  notification: { icon: Send, color: "text-medium-ink" },
  blocked: { icon: Ban, color: "text-critical-ink" },
  upload: { icon: Upload, color: "text-success-ink" },
};

/* The label is the English source, translated here rather than at each call
   site — the value beside it is a date and stays as it comes. */
function MetaField({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground mb-0.5">{t(label)}</div>
      <div className={`text-sm font-medium ${valueClassName ?? ""}`}>{value}</div>
    </div>
  );
}

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
  const status = STATUS_META[doc.status];
  const callout = CALLOUT_META[doc.status];
  const CalloutIcon = callout.icon;

  /* Same two keys the compliance table uses for its expiry column. */
  const daysLabel =
    doc.daysUntilExpiry < 0
      ? t("Expired {days}d ago", { days: Math.abs(doc.daysUntilExpiry) })
      : t("{days}d remaining", { days: doc.daysUntilExpiry });

  const statusCallout = doc.statusNote ? (
    <div className={`flex gap-2.5 rounded-lg p-3 ${callout.className}`}>
      <CalloutIcon size={16} className={`shrink-0 mt-0.5 ${callout.iconColor}`} aria-hidden="true" />
      <div>
        <div className="text-sm font-semibold">{t(callout.title)}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {translateStatusNote(doc.statusNote, t)}
        </div>
      </div>
    </div>
  ) : null;

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

  function escalate() {
    toast({
      title: t("Escalated to manager"),
      description: t("{document} — {supplier} flagged for review.", {
        document: t(doc.documentName),
        supplier: doc.supplierName,
      }),
      tone: "warning",
    });
    onClose();
  }

  // The "what to do next" alert shown for actionable documents without a pending
  // renewal. Uses the same wording pattern as the design example.
  const RECOMMENDATION: Partial<Record<DocStatus, { type: AlertBannerType; title: string; body: string }>> = {
    "warning-60": {
      type: "warning",
      title: t("60-day window — action recommended"),
      body: t("Send a manual reminder now to give the supplier time to prepare their renewal."),
    },
    "warning-30": {
      type: "warning",
      title: t("30-day window — action recommended"),
      body: t("The 30-day auto-notification has been sent. A manual reminder can prompt a faster response."),
    },
    blocked: {
      type: "error",
      title: t("Expired — supplier blocked"),
      body: t("This document has expired and the supplier is blocked from new work orders until a renewal is uploaded and accepted."),
    },
    "rejected-resubmit": {
      type: "error",
      title: t("Resubmission required"),
      body: t("The last upload was rejected in review. Ask the supplier to correct and re-submit the document."),
    },
  };
  const recommendation = RECOMMENDATION[doc.status];

  type Action = { tone: Tone; icon: LucideIcon; title: string; description: string; onClick: () => void };
  const remindAction: Action = {
    tone: "info",
    icon: Send,
    title: t("Send Manual Reminder"),
    description:
      doc.status === "rejected-resubmit"
        ? t("Ask {supplier} to correct and re-upload", { supplier: doc.supplierName })
        : t("Notify {supplier} to upload their renewal", { supplier: doc.supplierName }),
    onClick: sendReminder,
  };
  // Already-blocked docs can't be revoked again — offer escalation instead.
  const secondAction: Action =
    doc.status === "blocked"
      ? {
          tone: "danger",
          icon: AlertTriangle,
          title: t("Escalate to Manager"),
          description: t("Flag this blocked supplier for management review"),
          onClick: escalate,
        }
      : {
          tone: "danger",
          icon: Ban,
          title: t("Revoke Supplier Access"),
          description: t("Block immediately — re-enable when document is renewed"),
          onClick: revoke,
        };
  const actions: Action[] = [remindAction, secondAction];

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-card h-full overflow-y-auto animate-in slide-in-from-right-6 fade-in duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
              {t(doc.documentCategory)}
            </div>
            <h3 className="font-semibold text-base mt-0.5">{t(doc.documentName)}</h3>
            <div className="text-xs text-muted-foreground mt-0.5">
              {doc.supplierName} · {t(doc.trade)}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={t("Close")}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Badge variant={status.tone}>{t(status.label)}</Badge>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <MetaField label="Expiry date" value={doc.expiryDate} />
          <MetaField
            label="Days remaining"
            value={daysLabel}
            valueClassName={doc.daysUntilExpiry < 0 ? "text-critical-ink" : undefined}
          />
          {doc.autoNotified && <MetaField label="Auto-notified" value={doc.autoNotified} />}
        </div>

        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
          >
            <FileText size={15} className="text-muted-foreground shrink-0" />
            {t("View attached document")}
          </a>
        )}

        {doc.renewal ? (
          <>
            {statusCallout}
            <RenewalReviewCard doc={doc} onReview={() => onReview(doc)} />
          </>
        ) : recommendation ? (
          <>
            <AlertBanner type={recommendation.type} title={recommendation.title}>
              {recommendation.body}
            </AlertBanner>
            <div className="space-y-2">
              {actions.map((a) => (
                <ActionCard
                  key={a.title}
                  tone={a.tone}
                  icon={a.icon}
                  title={a.title}
                  description={a.description}
                  onClick={a.onClick}
                />
              ))}
            </div>
          </>
        ) : (
          statusCallout
        )}

        {/* Document history */}
        {doc.history.length > 0 && (
          <div>
            <div className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground mb-3">
              {t("Document history")}
            </div>
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
