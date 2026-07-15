import { X, ArrowUpRight } from "lucide-react";
import type { Ticket, SupplierDoc, TicketStatus } from "@/types";
import { useLynkData } from "@/lib/LynkDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RenewalReviewCard } from "@/components/yarowa/renewal-review-card";
import { TicketStatusMenu } from "@/components/yarowa/ticket-status-menu";
import { CriticalityIcon } from "@/components/yarowa/criticality-icon";
import type { View } from "@/App";

const sourceToView: Record<string, View> = {
  "compliance-monitoring": "compliance",
  contracts: "contracts",
  "data-governance": "data-governance",
  onboarding: "onboarding",
};

const sourceLabel: Record<string, string> = {
  "compliance-monitoring": "Compliance Monitoring",
  contracts: "Contract Management",
  "data-governance": "Data Governance",
  onboarding: "Onboarding",
  prospect: "Suppliers",
  "data-quality": "Suppliers",
};

export function TicketDrawer({
  ticket,
  onClose,
  onNavigate,
  onResolve,
  onReview,
}: {
  ticket: Ticket;
  onClose: () => void;
  onNavigate: (view: View, selectedId?: string) => void;
  onResolve: (ticket: Ticket, action: string) => void;
  onReview: (doc: SupplierDoc) => void;
}) {
  const {
    docs: DOCS,
    contracts: CONTRACTS,
    dataGovernanceRequests: DATA_GOVERNANCE_REQUESTS,
    onboardingCases: ONBOARDING_CASES,
    ticketStatusById,
    setTicketStatus,
  } = useLynkData();
  const status: TicketStatus = ticketStatusById.get(ticket.id) ?? "To do";
  const doc = ticket.source === "compliance-monitoring" ? DOCS.find((d) => d.id === ticket.targetId) : undefined;
  const contract = ticket.source === "contracts" ? CONTRACTS.find((c) => c.id === ticket.targetId) : undefined;
  const dgr = ticket.source === "data-governance" ? DATA_GOVERNANCE_REQUESTS.find((r) => r.id === ticket.targetId) : undefined;
  const onb = ticket.source === "onboarding" ? ONBOARDING_CASES.find((o) => o.id === ticket.targetId) : undefined;

  const targetView = sourceToView[ticket.source];

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-card h-full overflow-y-auto animate-in slide-in-from-right-6 fade-in duration-200">
      <div className="p-4 flex items-start justify-between border-b border-border">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Badge variant={ticket.criticality}>
              <CriticalityIcon criticality={ticket.criticality} />
              {ticket.criticality}
            </Badge>
            <Badge variant="neutral">{sourceLabel[ticket.source]}</Badge>
          </div>
          <TicketStatusMenu status={status} onChange={(s) => setTicketStatus(ticket, s)} />
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base mb-3">{ticket.title}</h3>

        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <div className="text-muted-foreground mb-0.5">ENTITY</div>
            <button
              className="text-accent underline font-medium"
              onClick={() => onNavigate("suppliers")}
            >
              {ticket.entityName}
            </button>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">TYPE</div>
            <div className="font-medium">{ticket.entityType}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">OPENED</div>
            <div className="font-medium">{ticket.ageLabel}</div>
          </div>
        </div>

        {doc && (
          <div className="border border-border rounded-lg p-3 mb-4 space-y-2 text-xs">
            <div className="font-semibold text-sm">{doc.documentName}</div>
            <div className="text-muted-foreground">{doc.documentCategory} · Expires {doc.expiryDate}</div>
            <div className="pt-2 border-t border-border space-y-1">
              {doc.history.map((h, i) => (
                <div key={i}>
                  <span className="font-medium">{h.event}</span> — {h.date} · {h.actor}
                </div>
              ))}
            </div>
          </div>
        )}

        {contract && (
          <div className="border border-border rounded-lg p-3 mb-4 space-y-2 text-xs">
            <div className="font-semibold text-sm">{contract.ref}</div>
            <div className="text-muted-foreground">
              {contract.type} · €{contract.annualValue.toLocaleString()}/yr
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <div className="text-muted-foreground">End date</div>
                <div className="font-medium">{contract.endDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Renewal by</div>
                <div className="font-medium">{contract.renewalBy}</div>
              </div>
            </div>
          </div>
        )}

        {dgr && (
          <div className="border border-border rounded-lg p-3 mb-4 space-y-2 text-xs">
            <div className="font-semibold text-sm">{dgr.category} change</div>
            <div className="text-muted-foreground">{dgr.reason}</div>
            <div className="space-y-1.5 pt-1">
              {dgr.fields.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">
                    {f.before} → {f.after}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {onb && (
          <div className="border border-border rounded-lg p-3 mb-4 space-y-2 text-xs">
            <div className="font-semibold text-sm">{onb.companyName}</div>
            <div className="text-muted-foreground">
              {onb.status} · {onb.daysNoResponse}d without response
            </div>
          </div>
        )}

        {doc?.renewal ? (
          <div className="mb-4">
            <RenewalReviewCard doc={doc} onReview={() => onReview(doc)} />
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-4">
              <div className="mb-1 font-medium text-foreground">What needs attention</div>
              Review this item and take the recommended action below, or open the full record for more
              context.
            </div>

            <div className="flex gap-2 mb-4">
              <Button variant="default" className="flex-1" onClick={() => onResolve(ticket, ticket.primaryAction)}>
                {ticket.primaryAction}
              </Button>
              {ticket.primaryAction !== "Escalate" && (
                <Button variant="outline" onClick={() => onResolve(ticket, "Escalate")}>
                  Escalate
                </Button>
              )}
            </div>
          </>
        )}

        {targetView && (
          <button
            onClick={() => onNavigate(targetView, ticket.targetId)}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-accent font-medium py-2 border-t border-border pt-3"
          >
            Open in {sourceLabel[ticket.source]}
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
