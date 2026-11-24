/**
 * @custom   The application a prospect submitted: company details, registered
 *           address, primary contact and the uploaded documents with their
 *           review status (a document with a file opens it). The Onboarding
 *           drawer and the ticket panel render this same component so an
 *           application reads the same in both. Composes Badge and Button.
 * @approved Yuliya Babkina, 2026-11-25
 */
import type { ComponentProps, ReactNode } from "react";
import { Building2, ExternalLink, FileText, Mail, MapPin, Phone } from "lucide-react";
import type { Contact, DocStatus, Supplier, SupplierDoc } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { Text } from "@/shared/ui/typography";

// Uploaded-document status → badge (mirrors the supplier portal).
type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;
const DOC_STATUS_META: Record<DocStatus, { label: string; variant: BadgeVariant }> = {
  valid: { label: "Valid", variant: "success-outline" },
  "warning-60": { label: "Expiring", variant: "orange-outline" },
  "warning-30": { label: "Expiring", variant: "warning-outline" },
  "pending-review": { label: "Pending review", variant: "warning-outline" },
  "rejected-resubmit": { label: "Resubmit", variant: "critical-outline" },
  blocked: { label: "Blocked", variant: "critical-outline" },
};

function SectionLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <Text variant="eyebrow" as="div" className="mb-2 flex items-center gap-1.5">
      {icon}
      {children}
    </Text>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-right text-sm">{value}</dd>
    </div>
  );
}

export function OnboardingApplicationBody({
  supplier,
  docs,
  className,
}: {
  supplier: Supplier;
  docs: SupplierDoc[];
  className?: string;
}) {
  const { t } = useI18n();
  const contact: Contact | undefined = supplier.contacts?.find((c) => c.primary) ?? supplier.contacts?.[0];

  return (
    <div className={className}>
      <SectionLabel icon={<Building2 className="size-3.5" />}>{t("Company details")}</SectionLabel>
      <dl className="mb-4 space-y-2">
        <Field label={t("Legal name")} value={supplier.name} />
        <Field label={t("VAT ID")} value={supplier.vatId || "—"} />
        <Field label={t("Trade")} value={supplier.trade ? t(supplier.trade) : "—"} />
        <Field label={t("Region")} value={supplier.region ? t(supplier.region) : "—"} />
      </dl>

      <SectionLabel icon={<MapPin className="size-3.5" />}>{t("Registered address")}</SectionLabel>
      <Text className="mb-4">{supplier.address || "—"}</Text>

      {contact && (
        <div className="mb-4">
          <SectionLabel>{t("Primary contact")}</SectionLabel>
          <Text as="div" className="mb-1">{contact.name}</Text>
          {contact.email && (
            <Text variant="small" as="div" className="flex items-center gap-1.5">
              <Mail className="size-3" /> {contact.email}
            </Text>
          )}
          {contact.phone && (
            <Text variant="small" as="div" className="mt-0.5 flex items-center gap-1.5">
              <Phone className="size-3" /> {contact.phone}
            </Text>
          )}
        </div>
      )}

      <SectionLabel icon={<FileText className="size-3.5" />}>
        {t("Documents ({count})", { count: docs.length })}
      </SectionLabel>
      <div className="space-y-1.5">
        {docs.length === 0 && <Text variant="small">{t("No documents submitted yet.")}</Text>}
        {docs.map((doc) => {
          const meta = DOC_STATUS_META[doc.status] ?? { label: doc.status, variant: "warning-outline" };
          const openable = Boolean(doc.fileUrl);
          return (
            <Button
              key={doc.id}
              type="button"
              variant="ghost"
              disabled={!openable}
              onClick={() => openable && window.open(doc.fileUrl, "_blank", "noopener")}
              className={cn(
                "h-auto w-full justify-between gap-2 rounded-md border-border px-2.5 py-2 text-left font-normal whitespace-normal disabled:pointer-events-auto disabled:opacity-100",
                openable
                  ? "cursor-pointer hover:bg-secondary/50 dark:hover:bg-secondary/50"
                  : "cursor-default hover:bg-transparent dark:hover:bg-transparent"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <Text variant="label" as="span" className="truncate">{t(doc.documentName)}</Text>
                {openable && <ExternalLink className="size-3 shrink-0 text-muted-foreground" />}
              </span>
              <Badge variant={meta.variant} className="shrink-0">
                {t(meta.label)}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
