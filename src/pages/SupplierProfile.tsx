import { useState, lazy, Suspense } from "react";
import { ArrowLeft, Building2, Edit, Mail, MoreHorizontal, FileText, MessageSquare } from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { CriticalityIcon } from "@/components/yarowa/criticality-icon";
import { criticalityLabel } from "@/lib/theme";
import { docStatusMeta } from "@/lib/document-status";
import { translateAgeLabel, translateTicketTitle } from "@/lib/ticket-i18n";
import { relationshipId } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { PRINCIPAL_ID } from "@/data";
import type { Ticket, SupplierDoc, ChatContext } from "../types";

// Lazy — pulls the heavy pdfjs-dist bundle (+ worker) into its own chunk that is
// only fetched when a user actually opens the PDF viewer.
const DocumentViewer = lazy(() =>
  import("@/components/yarowa/document-viewer").then((m) => ({ default: m.DocumentViewer }))
);

const ACTIVITY: Record<string, { label: string; who: string; date: string; tone: "warning" | "success" | "danger" | "neutral" }[]> = {
  bauparts: [
    { label: "IBAN change request submitted by supplier", who: "Laura Heinz", date: "Today, 09:14", tone: "warning" },
    { label: "Manual compliance reminder sent", who: "Sabine Müller", date: "Yesterday", tone: "neutral" },
    { label: "30-day auto-notification sent for ISO 9001", who: "System", date: "1 Jun 2026", tone: "danger" },
    { label: "Public Liability Insurance expired — supplier blocked", who: "System", date: "15 May 2026", tone: "danger" },
    { label: "Compliance resolved — insurance uploaded", who: "Laura Heinz", date: "10 Mar 2026", tone: "success" },
    { label: "Compliance flag raised on Framework Contract", who: "System", date: "18 Feb 2026", tone: "warning" },
    { label: "Contract renewal reminder triggered", who: "System", date: "3 Jan 2026", tone: "neutral" },
    { label: "Profile last updated — annual review", who: "Sabine Müller", date: "15 Dec 2025", tone: "neutral" },
  ],
};

export function SupplierProfile({
  supplierId,
  onBack,
  onSelectTicket,
  onOpenChat,
}: {
  supplierId: string;
  onBack: () => void;
  onSelectTicket: (t: Ticket) => void;
  /** Opens the shell's chat dock on this supplier's conversation. */
  onOpenChat: (
    supplierId: string,
    draftContext?: ChatContext,
    overrides?: { onOpenContext?: (context: ChatContext) => void }
  ) => void;
}) {
  const {
    suppliers: SUPPLIERS,
    tickets: TICKETS,
    contracts: CONTRACTS,
    docs: DOCS,
    unreadFor,
  } = useLynkData();
  const { t } = useI18n();
  const [previewDoc, setPreviewDoc] = useState<SupplierDoc | null>(null);
  const supplier = SUPPLIERS.find((s) => s.id === supplierId);
  if (!supplier) return null;

  /* The PM is always writing on behalf of the Principal that runs this tenant,
     so the conversation is that principal's — never another's. */
  const conversation = relationshipId(PRINCIPAL_ID, supplierId);
  const unread = unreadFor(conversation, "principal");

  function openChat() {
    onOpenChat(supplierId, undefined, {
      // While the profile is up, a document link previews in place rather than
      // sending the manager off to Compliance Monitoring.
      onOpenContext: (context) => {
        const doc = DOCS.find((d) => d.id === context.id || d.documentName === context.id);
        if (doc) setPreviewDoc(doc);
      },
    });
  }

  const tickets = TICKETS.filter((t) => t.entityName === supplier.name);
  const contracts = CONTRACTS.filter((c) => c.supplierName === supplier.name);
  const docs = DOCS.filter((d) => d.supplierId === supplierId);
  const activity = ACTIVITY[supplierId] ?? [];
  const healthScore = supplier.rating ?? 60;

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground">
        <ArrowLeft size={14} /> {t("Suppliers Overview")} <span className="mx-1">/</span> <span className="text-foreground font-medium">{supplier.name}</span>
      </button>

      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
            <Building2 size={20} className="text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{supplier.name}</h1>
              <Badge variant="neutral">{t(supplier.stage)}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t(supplier.trade)} · {t(supplier.region)} ·{" "}
              {t("Last active {when}", { when: translateAgeLabel(supplier.lastActive, t) })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-xl font-bold">{healthScore}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{t("Health Score")}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{supplier.openTickets}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{t("Open Tickets")}</div>
          </div>
          <Button variant="outline">
            <Edit size={14} /> {t("Edit")}
          </Button>
          <Button variant={unread > 0 ? "default" : "outline"} onClick={openChat}>
            <MessageSquare size={14} /> {t("Chat")}
            {unread > 0 && (
              <span className="ml-1 rounded-full bg-critical px-1.5 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </Button>
          <Button variant="outline">
            <Mail size={14} /> {t("Contact")}
          </Button>
          <Button variant="ghost">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: "Compliance", value: t(supplier.compliance === "Fully Compliant" ? "Good" : "Warning") },
          { label: "Contracts", value: contracts.length > 0 ? t(contracts[0].status) : "—" },
          {
            label: "Documents",
            value: t("{valid}/{total} valid", {
              valid: docs.filter((d) => d.status === "valid").length,
              total: docs.length || 5,
            }),
          },
          { label: "Performance", value: `${healthScore}/100` },
          { label: "Open Tickets", value: supplier.openTickets },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{t(c.label)}</div>
            <div className="font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          {t("Open Tickets")} · {tickets.length}
        </div>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {tickets.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">{t("No open tickets.")}</div>
          )}
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/50"
            >
              <div className="min-w-0">
                {/* Same treatment the Task Queue gives a ticket: the title is a
                    templated backend string, the age a relative label. */}
                <div className="text-sm font-medium truncate">{translateTicketTitle(ticket.title, t)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {translateAgeLabel(ticket.ageLabel, t)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={ticket.criticality}>
                  <CriticalityIcon criticality={ticket.criticality} />
                  {t(criticalityLabel[ticket.criticality])}
                </Badge>
                <Button variant="outline">{t(ticket.primaryAction)}</Button>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">{t("Contacts")}</div>
          <div className="space-y-3">
            {supplier.contacts.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{c.name}</span>{" "}
                  {c.primary && <Badge variant="info">{t("Primary")}</Badge>}
                  <div className="text-xs text-muted-foreground">{t(c.role)}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </div>
                <div className="text-xs text-muted-foreground">{c.phone}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">{t("Services")}</div>
          <div className="text-xs text-muted-foreground mb-1">{t("Trade Categories")}</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[supplier.trade, "Site Safety"].map((tag) => (
              <Badge key={tag} variant="neutral">
                {t(tag)}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mb-1">{t("Regions Served")}</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {supplier.regionsServed.map((r) => (
              <Badge key={r} variant="neutral">
                {t(r)}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mb-1">{t("Capabilities")}</div>
          <div className="flex flex-wrap gap-1.5">
            {supplier.capabilities.map((c) => (
              <Badge key={c} variant="neutral">
                {t(c)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">{t("Documents")}</div>
            <span className="text-xs text-muted-foreground">{t("{count} on file", { count: docs.length })}</span>
          </div>
          <div className="divide-y divide-border">
            {docs.map((d) => {
              const badgeVariant =
                d.status === "valid" ? "success" : d.status === "blocked" ? "danger" : "warning";
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    {d.fileUrl ? (
                      <button
                        onClick={() => setPreviewDoc(d)}
                        className="flex items-center gap-1.5 text-sm font-medium truncate hover:underline hover:text-accent"
                        title={t("Preview attached document")}
                      >
                        <FileText size={14} className="text-muted-foreground shrink-0" />
                        {t(d.documentName)}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium truncate">
                        <FileText size={14} className="text-muted-foreground shrink-0" />
                        {t(d.documentName)}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {t(d.documentCategory)}
                      {d.expiryDate ? ` · ${t("Expires {date}", { date: d.expiryDate })}` : ""}
                    </div>
                  </div>
                  <Badge variant={badgeVariant} className="shrink-0">
                    {t(docStatusMeta(d.status).label)}
                  </Badge>
                </div>
              );
            })}
            {docs.length === 0 && (
              <div className="text-sm text-muted-foreground">{t("No documents on file.")}</div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">{t("Contracts")}</div>
            <span className="text-xs text-accent">{t("View all")}</span>
          </div>
          <div className="space-y-2 text-sm">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.ref}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(c.type)} · {t("Valid to {date}", { date: c.endDate })}
                  </div>
                </div>
                <Badge variant="warning">{t(c.status)}</Badge>
              </div>
            ))}
            {contracts.length === 0 && (
              <div className="text-muted-foreground">{t("No contracts on file.")}</div>
            )}
          </div>
        </div>

        {supplier.iban && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              {t("Master Data")}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("VAT ID")}</span>
                <span className="font-medium">{supplier.vatId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("IBAN")}</span>
                <span className="font-medium">{supplier.iban}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("Address")}</span>
                <span className="font-medium">{supplier.address}</span>
              </div>
            </div>
            <AlertBanner type="warning" className="mt-3">
              {t("IBAN change request pending four-eyes approval")}
            </AlertBanner>
          </div>
        )}

        {activity.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              {t("Activity Timeline")}
            </div>
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      a.tone === "success"
                        ? "bg-success"
                        : a.tone === "danger"
                        ? "bg-critical"
                        : a.tone === "warning"
                        ? "bg-high"
                        : "bg-low"
                    }`}
                  />
                  <div>
                    <div className="font-medium leading-tight">{t(a.label)}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.date} · {a.who}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {previewDoc && (
        <Suspense fallback={null}>
          <DocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        </Suspense>
      )}

    </div>
  );
}
