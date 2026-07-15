import { ArrowLeft, Building2, Edit, Mail, MoreHorizontal, FileText } from "lucide-react";
import { useLynkData } from "../lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { CriticalityIcon } from "@/components/yarowa/criticality-icon";
import type { Ticket } from "../types";

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
}: {
  supplierId: string;
  onBack: () => void;
  onSelectTicket: (t: Ticket) => void;
}) {
  const { suppliers: SUPPLIERS, tickets: TICKETS, contracts: CONTRACTS, docs: DOCS } = useLynkData();
  const supplier = SUPPLIERS.find((s) => s.id === supplierId);
  if (!supplier) return null;

  const tickets = TICKETS.filter((t) => t.entityName === supplier.name);
  const contracts = CONTRACTS.filter((c) => c.supplierName === supplier.name);
  const docs = DOCS.filter((d) => d.supplierId === supplierId);
  const activity = ACTIVITY[supplierId] ?? [];
  const healthScore = supplier.rating ?? 60;

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground">
        <ArrowLeft size={14} /> Suppliers Overview <span className="mx-1">/</span> <span className="text-foreground font-medium">{supplier.name}</span>
      </button>

      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
            <Building2 size={20} className="text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{supplier.name}</h1>
              <Badge variant="neutral">{supplier.stage}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {supplier.trade} · {supplier.region} · Last active {supplier.lastActive}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-xl font-bold">{healthScore}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Health Score</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{supplier.openTickets}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Open Tickets</div>
          </div>
          <Button variant="outline">
            <Edit size={14} /> Edit
          </Button>
          <Button variant="outline">
            <Mail size={14} /> Contact
          </Button>
          <Button variant="ghost">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: "Compliance", value: supplier.compliance === "Fully Compliant" ? "Good" : "Warning" },
          { label: "Contracts", value: contracts.length > 0 ? contracts[0].status : "—" },
          { label: "Documents", value: `${docs.filter((d) => d.status === "valid").length}/${docs.length || 5} valid` },
          { label: "Performance", value: `${healthScore}/100` },
          { label: "Open Tickets", value: supplier.openTickets },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className="font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Open Tickets · {tickets.length}
        </div>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {tickets.length === 0 && <div className="p-4 text-sm text-muted-foreground">No open tickets.</div>}
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTicket(t)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/50"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.ageLabel}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={t.criticality}>
                  <CriticalityIcon criticality={t.criticality} />
                  {t.criticality}
                </Badge>
                <Button variant="outline">{t.primaryAction}</Button>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Contacts</div>
          <div className="space-y-3">
            {supplier.contacts.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{c.name}</span>{" "}
                  {c.primary && <Badge variant="info">Primary</Badge>}
                  <div className="text-xs text-muted-foreground">{c.role}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </div>
                <div className="text-xs text-muted-foreground">{c.phone}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Services</div>
          <div className="text-xs text-muted-foreground mb-1">Trade Categories</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[supplier.trade, "Site Safety"].map((t) => (
              <Badge key={t} variant="neutral">{t}</Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mb-1">Regions Served</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {supplier.regionsServed.map((r) => (
              <Badge key={r} variant="neutral">{r}</Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mb-1">Capabilities</div>
          <div className="flex flex-wrap gap-1.5">
            {supplier.capabilities.map((c) => (
              <Badge key={c} variant="neutral">{c}</Badge>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Compliance Snapshot</div>
            <span className="text-xs text-accent">View all</span>
          </div>
          <div className="space-y-2 text-sm">
            {(docs.length ? docs : []).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  {d.fileUrl ? (
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 truncate hover:underline hover:text-accent"
                      title="View attached document"
                    >
                      <FileText size={13} className="text-muted-foreground shrink-0" />
                      {d.documentName}
                    </a>
                  ) : (
                    <span className="truncate">{d.documentName}</span>
                  )}
                </span>
                <Badge variant={d.status === "valid" ? "success" : d.status === "blocked" ? "danger" : "warning"}>
                  {d.status}
                </Badge>
              </div>
            ))}
            {docs.length === 0 && <div className="text-muted-foreground">No documents on file.</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Contracts</div>
            <span className="text-xs text-accent">View all</span>
          </div>
          <div className="space-y-2 text-sm">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.ref}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.type} · Valid to {c.endDate}
                  </div>
                </div>
                <Badge variant="warning">{c.status}</Badge>
              </div>
            ))}
            {contracts.length === 0 && <div className="text-muted-foreground">No contracts on file.</div>}
          </div>
        </div>

        {supplier.iban && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Master Data</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VAT ID</span>
                <span className="font-medium">{supplier.vatId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">IBAN</span>
                <span className="font-medium">{supplier.iban}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium">{supplier.address}</span>
              </div>
            </div>
            <AlertBanner type="warning" className="mt-3">
              IBAN change request pending four-eyes approval
            </AlertBanner>
          </div>
        )}

        {activity.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Activity Timeline</div>
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
                    <div className="font-medium leading-tight">{a.label}</div>
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
    </div>
  );
}
