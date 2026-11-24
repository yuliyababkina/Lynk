/**
 * @custom   Task-queue panel for one ticket: a fixed skeleton (header badges,
 *           ownership, ticket facts, the linked record, alert, actions,
 *           history, links, Escalate / Chat) around the record's own body —
 *           the same document facts, change-request body and application body
 *           its workspace shows. Status rules live in lib/ticket-panel.ts.
 *           Domain workflow over DetailDrawer; composes Badge, Button,
 *           Separator, AlertBanner, FactList, DataChangeBody,
 *           ProspectDecisionActions, RevokeAccessDialog,
 *           OnboardingApplicationBody, RenewalReviewCard, TicketStatusMenu,
 *           AssigneePicker, and AlertDialog / Dialog for the reject reason and
 *           the contact-email change.
 * @approved Yuliya Babkina, 2026-11-18
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Bell,
  Check,
  CheckCheck,
  Eye,
  Link2,
  Mail,
  MessageSquare,
  PencilLine,
  RefreshCw,
  Send,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ChatContext, SupplierDoc, Ticket, TicketStatus } from "@/types";
import type { View } from "@/App";
import { useLynkData } from "@/lib/lynk-data-context";
import { ACTION_ICON } from "@/lib/action-icons";
import { useI18n } from "@/lib/i18n-context";
import { translateAgeLabel, translateTicketTitle } from "@/lib/ticket-i18n";
import { relationshipId, todayDisplayDate } from "@/lib/db";
import { toast } from "@/lib/toast";
import { PRINCIPAL_ID } from "@/data";
import {
  isContractWorkspaceTicket,
  resolveTicketTarget,
  targetRecordId,
  type TicketTarget,
} from "@/lib/ticket-target";
import { buildPanelModel, type PanelAction, type PanelActionId, type PanelEvent } from "@/lib/ticket-panel";
import type { ProspectDecision } from "@/lib/db";
import { useInviteReminder } from "@/shared/hooks/use-invite-reminder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailDrawer } from "@/components/yarowa/detail-drawer";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import { FactList } from "@/components/yarowa/fact-list";
import { DataChangeBody } from "@/components/yarowa/data-change-body";
import { OnboardingApplicationBody } from "@/components/yarowa/onboarding-application-body";
import { RenewalReviewCard } from "@/components/yarowa/renewal-review-card";
import { RevokeAccessDialog } from "@/components/yarowa/revoke-access-dialog";
import { ProspectDecisionActions } from "@/components/yarowa/prospect-decision-actions";
import { TicketStatusMenu } from "@/components/yarowa/ticket-status-menu";
import { CriticalityIcon } from "@/components/yarowa/criticality-icon";
import { AssigneePicker } from "@/components/yarowa/assignee-picker";
import { Heading, Text } from "@/shared/ui/typography";

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

const ACTION_ICONS: Partial<Record<PanelActionId, LucideIcon>> = {
  "doc-remind": Send,
  "doc-revoke": Ban,
  "dgr-endorse": Check,
  "dgr-final": CheckCheck,
  "dgr-reject": X,
  "onb-remind": Bell,
  "onb-change-email": Mail,
  "onb-accept": Check,
  "onb-request-changes": PencilLine,
  "onb-reject": XCircle,
  "contract-review": Eye,
  "contract-renew": RefreshCw,
};

/** Application decisions render as ProspectDecisionActions, the same block Onboarding uses. */
const DECISIONS: PanelActionId[] = ["onb-accept", "onb-request-changes", "onb-reject"];

function chatContextFor(target: TicketTarget, ticket: Ticket, label: string): ChatContext {
  const id = targetRecordId(target) ?? ticket.id;
  if (target.kind === "document") return { type: "document", id, label };
  if (target.kind === "onboarding") return { type: "onboarding-case", id, label };
  return { type: "data-change", id, label };
}

export function TicketDrawer({
  ticket,
  onClose,
  onNavigate,
  onOpenSupplier,
  onResolve,
  onReview,
  onOpenChat,
}: {
  ticket: Ticket;
  onClose: () => void;
  /** Opens a workspace with this record selected; `review` opens an onboarding case in its full review. */
  onNavigate: (view: View, selectedId?: string, opts?: { review?: boolean }) => void;
  onOpenSupplier: (entityName: string) => void;
  onResolve: (ticket: Ticket, action: string) => void;
  onReview: (doc: SupplierDoc) => void;
  /** Opens the supplier's conversation with this ticket attached. */
  onOpenChat?: (supplierId: string, context: ChatContext) => void;
}) {
  const {
    docs,
    contracts,
    dataGovernanceRequests,
    onboardingCases,
    suppliers,
    ticketStatusById,
    setTicketStatus,
    unreadFor,
    tickets,
    users,
    currentUser,
    setTicketAssignee,
    reviewProspect,
    endorseDataChange,
    approveDataChange,
    rejectDataChange,
    updateOnboardingEmail,
    renewContract,
  } = useLynkData();
  const { t } = useI18n();
  const sendInviteReminder = useInviteReminder();
  const [revoking, setRevoking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectingChange, setRejectingChange] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  const status: TicketStatus = ticketStatusById.get(ticket.id) ?? "To do";
  /* The `ticket` prop is the copy the row was clicked with; the assignee is read
     live so a change in the row or here shows in both at once. */
  const assigneeId = tickets.find((x) => x.id === ticket.id)?.assigneeId ?? ticket.assigneeId ?? null;
  const assignee = users.find((u) => u.id === assigneeId) ?? null;

  const target = useMemo(
    () => resolveTicketTarget(ticket, { docs, contracts, dataGovernanceRequests, onboardingCases, suppliers }),
    [ticket, docs, contracts, dataGovernanceRequests, onboardingCases, suppliers]
  );
  const model = buildPanelModel(ticket, status, target, t, {
    currentUserId: currentUser.id,
    userName: (id) => users.find((u) => u.id === id)?.name,
    today: todayDisplayDate(),
  });
  const title = translateTicketTitle(ticket.title, t);
  const recordId = targetRecordId(target);
  const targetView = sourceToView[ticket.source];

  /* A ticket names its entity by display name, so the conversation is found
     the same way "Open supplier" already finds the profile. A ticket about
     something that is not a company we hold a relationship with — a stale
     name, an invitation nobody has answered — simply gets no Chat button. */
  const chatSupplier = suppliers.find((s) => s.name === ticket.entityName);
  const chatUnread = chatSupplier ? unreadFor(relationshipId(PRINCIPAL_ID, chatSupplier.id), "principal") : 0;
  const openChat = () => {
    if (!chatSupplier) return;
    // The ticket travels as the message's context, so the supplier sees what
    // it is about without the manager retyping it.
    onOpenChat?.(chatSupplier.id, chatContextFor(target, ticket, model.objectName ?? title));
  };

  async function run(action: PanelAction) {
    switch (action.id) {
      case "doc-remind":
        return onResolve(ticket, "Remind");
      case "doc-revoke":
        if (target.kind !== "document") return;
        toast({
          title: t("Supplier access revoked"),
          description: t("{supplier} is blocked from new work orders until {document} is renewed.", {
            supplier: target.doc.supplierName,
            document: t(target.doc.documentName),
          }),
          tone: "warning",
        });
        return;
      case "dgr-endorse":
        if (target.kind !== "data-change") return;
        await endorseDataChange(target.request.id);
        return onResolve(ticket, "Endorse");
      case "dgr-final":
        if (target.kind !== "data-change") return;
        await approveDataChange(target.request.id);
        return onResolve(ticket, "Final approval");
      case "onb-remind":
        if (target.kind !== "onboarding") return;
        if (await sendInviteReminder(target.caseItem, { quietSuccess: true })) onResolve(ticket, "Remind");
        return;
      case "contract-review":
        return onResolve(ticket, "Review");
      case "contract-renew":
        if (target.kind === "contract") await renewContract(target.contract.id);
        return onResolve(ticket, "Renew");
      default:
        return onResolve(ticket, ticket.primaryAction);
    }
  }

  async function press(action: PanelAction) {
    if (action.id === "doc-revoke") return setRevoking(true);
    if (action.id === "dgr-reject") return setRejectingChange(true);
    if (action.id === "onb-change-email") return setChangingEmail(true);
    setBusy(true);
    try {
      await run(action);
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: ProspectDecision, note?: string) {
    if (target.kind !== "onboarding" || !target.supplier) return;
    await reviewProspect(target.supplier.id, target.supplier.name, decision, note);
    onResolve(ticket, decision === "accept" ? "Accept" : decision === "reject" ? "Reject" : "Request changes");
  }

  const decisions = model.actions.some((a) => DECISIONS.includes(a.id));
  const buttons = model.actions.filter((a) => !DECISIONS.includes(a.id));
  const primary = buttons.find((a) => a.emphasis === "primary");
  const secondary = buttons.filter((a) => a.emphasis === "secondary");
  const destructive = buttons.filter((a) => a.emphasis === "destructive");

  const actionButton = (a: PanelAction) => {
    const Icon = a.id === "ticket-primary" ? ACTION_ICON[ticket.primaryAction] : ACTION_ICONS[a.id];
    return (
      <Button
        key={a.id}
        variant={a.emphasis === "primary" ? "default" : "outline"}
        className={
          a.emphasis === "destructive"
            ? "w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "w-full"
        }
        disabled={busy || a.disabled}
        onClick={() => press(a)}
      >
        {Icon && <Icon size={14} />}
        {a.label}
      </Button>
    );
  };
  const actionBlock = (a: PanelAction) =>
    a.note ? (
      <div key={a.id} className="space-y-1">
        {actionButton(a)}
        <Text variant="small" as="div">{a.note}</Text>
      </div>
    ) : (
      actionButton(a)
    );

  return (
    <DetailDrawer
      onClose={onClose}
      header={
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={ticket.criticality}>
              <CriticalityIcon criticality={ticket.criticality} />
              {t(ticket.criticality)}
            </Badge>
            <Badge variant="neutral">{t(sourceLabel[ticket.source])}</Badge>
            {model.objectStatus && <Badge variant={model.objectStatus.variant}>{model.objectStatus.label}</Badge>}
          </div>
          {/* Copy-link slot, reserved for LYNK-120. */}
          <Button
            variant="ghost"
            size="icon-xs"
            disabled
            aria-label={t("Copy link")}
            title={t("Copy link")}
            className="shrink-0 text-muted-foreground"
          >
            <Link2 size={14} />
          </Button>
        </div>
      }
    >
      {/* Ownership first: status and assignee, label left / value right, so
          both are in view the moment the drawer opens. */}
      <div className="mb-4 grid grid-cols-[88px_1fr] items-center gap-x-3 gap-y-2 border-b border-border pb-4">
        <Text variant="small" as="div">{t("Status")}</Text>
        <div>
          <TicketStatusMenu status={status} onChange={(s) => setTicketStatus(ticket, s)} />
        </div>
        <Text variant="small" as="div">{t("Assignee")}</Text>
        <div className="min-w-0 -ml-1.5">
          <AssigneePicker
            variant="field"
            align="start"
            assignee={assignee}
            currentUser={currentUser}
            users={users}
            onChange={(id) => setTicketAssignee(ticket, id)}
          />
        </div>
      </div>

      <Heading level={3} className="mb-4">{title}</Heading>

      <div className="space-y-5">
        {/* The ticket's own facts. */}
        <section>
          <Text variant="eyebrow" as="div" className="mb-2">{t("Ticket")}</Text>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <Text variant="small" as="div" className="mb-0.5">{t("Entity")}</Text>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="link"
                  className="h-auto justify-start p-0 text-left whitespace-normal text-accent"
                  onClick={() => onOpenSupplier(ticket.entityName)}
                >
                  {ticket.entityName}
                </Button>
                {ticket.entityType === "Prospect" && <Badge variant="neutral">{t("Prospect")}</Badge>}
              </div>
            </div>
            {ticket.ageLabel && (
              <div>
                <Text variant="small" as="div" className="mb-0.5">{t("Opened")}</Text>
                <Text variant="label" as="div">{translateAgeLabel(ticket.ageLabel, t)}</Text>
              </div>
            )}
          </div>
        </section>

        {/* The record the ticket is about, as its workspace shows it. */}
        {model.objectLabel && (
          <section>
            <Text variant="eyebrow" as="div" className="mb-2">{model.objectLabel}</Text>
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div>
                <Heading level={4} as="div">{model.objectName}</Heading>
                {model.objectSub && <Text variant="small" as="div" className="mt-0.5">{model.objectSub}</Text>}
              </div>
              <FactList facts={model.facts} />
              {target.kind === "data-change" && <DataChangeBody request={target.request} layout="stacked" />}
              {target.kind === "onboarding" && target.supplier && model.fullReview && (
                <OnboardingApplicationBody supplier={target.supplier} docs={target.docs} />
              )}
            </div>
          </section>
        )}

        {model.alert && (
          <AlertBanner type={model.alert.type} title={model.alert.title}>
            {model.alert.body}
          </AlertBanner>
        )}

        {model.renewalReview && target.kind === "document" && (
          <RenewalReviewCard doc={target.doc} onReview={() => onReview(target.doc)} />
        )}

        {model.actions.length > 0 && (
          <section className="space-y-2">
            {primary && (
              <div className="space-y-1.5">
                <Text variant="eyebrow" as="div">{t("Recommended")}</Text>
                {actionBlock(primary)}
              </div>
            )}
            {secondary.map(actionBlock)}
            {destructive.length > 0 && (
              <>
                <Separator className="my-3" />
                {destructive.map(actionButton)}
              </>
            )}
            {decisions && target.kind === "onboarding" && (
              <ProspectDecisionActions
                companyName={target.caseItem.companyName}
                canAccept={model.actions.some((a) => a.id === "onb-accept")}
                onDecide={decide}
              />
            )}
          </section>
        )}

        {target.kind === "document" && (
          <RevokeAccessDialog
            open={revoking}
            onOpenChange={setRevoking}
            supplierName={target.doc.supplierName}
            onConfirm={() => run({ id: "doc-revoke", label: "", emphasis: "destructive" })}
          />
        )}

        {target.kind === "data-change" && (
          <RejectChangeDialog
            open={rejectingChange}
            onOpenChange={setRejectingChange}
            supplierName={target.request.supplierName}
            onConfirm={async (reason) => {
              await rejectDataChange(target.request.id, reason);
              onResolve(ticket, "Reject change");
            }}
          />
        )}

        {target.kind === "onboarding" && (
          <ContactEmailDialog
            open={changingEmail}
            onOpenChange={setChangingEmail}
            companyName={target.caseItem.companyName}
            email={target.caseItem.email ?? ""}
            onSave={async (email) => {
              await updateOnboardingEmail(target.caseItem.id, email);
              toast({ title: t("Contact email updated"), description: email, tone: "success" });
            }}
          />
        )}

        {model.history.length > 0 && <History events={model.history} />}

        {(model.fullReview || (targetView && recordId && !isContractWorkspaceTicket(ticket))) && (
          <section className="flex flex-col items-start gap-1.5 border-t border-border pt-3">
            {model.fullReview && recordId && (
              <Button
                variant="link"
                className="h-auto gap-1.5 p-0 text-accent"
                onClick={() => onNavigate("onboarding", recordId, { review: true })}
              >
                {t("Open full review")}
                <ArrowUpRight size={14} />
              </Button>
            )}
            {targetView && recordId && !isContractWorkspaceTicket(ticket) && (
              <Button
                variant="link"
                className="h-auto gap-1.5 p-0 text-accent"
                onClick={() => onNavigate(targetView, recordId)}
              >
                {t("Open in {view}", { view: t(sourceLabel[ticket.source]) })}
                <ArrowUpRight size={14} />
              </Button>
            )}
          </section>
        )}

        {(model.escalate || chatSupplier) && (
          <div className="flex gap-2 border-t border-border pt-4">
            {model.escalate && (
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => onResolve(ticket, "Escalate")}>
                <AlertTriangle size={14} />
                {t("Escalate")}
              </Button>
            )}
            {/* The supplier portal puts a Chat button on its own tickets, so the
                same ticket has to be answerable from this side too. */}
            {chatSupplier && (
              <Button variant="outline" className="flex-1" onClick={openChat}>
                <MessageSquare size={14} />
                {t("Chat")}
                {chatUnread > 0 && (
                  <Badge variant="count-critical" className="ml-1">
                    {chatUnread}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

    </DetailDrawer>
  );
}

/** Latest event first; the rest behind a toggle so the panel stays short. */
function History({ events }: { events: PanelEvent[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const shown = open ? events : events.slice(0, 1);
  const earlier = events.length - 1;
  return (
    <section>
      <Text variant="eyebrow" as="div" className="mb-2">{t("History")}</Text>
      <ol className="space-y-2">
        {shown.map((h, i) => (
          <li key={i}>
            <Text as="div">{h.event}</Text>
            <Text variant="small" as="div">
              {h.actor ? `${h.date} · ${h.actor}` : h.date}
            </Text>
          </li>
        ))}
      </ol>
      {earlier > 0 && (
        <Button variant="link" size="xs" className="mt-1 h-auto p-0 text-accent" onClick={() => setOpen((o) => !o)}>
          {open ? t("Hide earlier") : t("Show {n} earlier", { n: earlier })}
        </Button>
      )}
    </section>
  );
}

/** Asks why a data change is rejected; the reason is shown on the rejected request. */
function RejectChangeDialog({
  open,
  onOpenChange,
  supplierName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Reject {supplier}'s change?", { supplier: supplierName })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("The current values stay in place. Your reason is kept with the request.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reject-change-reason" className="block text-xs leading-4 text-muted-foreground">
            {t("Reason for rejection")}
          </Label>
          <Textarea
            id="reject-change-reason"
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field-sizing-fixed min-h-0 border-border bg-background p-2 text-sm"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("Cancel")}</AlertDialogCancel>
          {/* A plain Button, not AlertDialogAction: the dialog stays open until it is saved. */}
          <Button variant="danger" disabled={busy || !reason.trim()} onClick={confirm}>
            {t("Reject change")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Corrects where an unanswered invitation goes. */
function ContactEmailDialog({
  open,
  onOpenChange,
  companyName,
  email,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  email: string;
  onSave: (email: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState(email);
  const [busy, setBusy] = useState(false);
  const trimmed = value.trim();
  const valid = EMAIL.test(trimmed) && trimmed !== email;
  async function save() {
    setBusy(true);
    try {
      await onSave(trimmed);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return;
        if (o) setValue(email);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Change contact email")}</DialogTitle>
          <DialogDescription>
            {t("Reminders for {company} go to the new address. The invitation link stays the same.", {
              company: companyName,
            })}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !busy) save();
          }}
        >
          <Label htmlFor="contact-email" className="block text-xs leading-4 text-muted-foreground">
            {t("Contact email")}
          </Label>
          <Input
            id="contact-email"
            type="email"
            autoFocus
            value={value}
            aria-invalid={trimmed !== "" && !EMAIL.test(trimmed)}
            onChange={(e) => setValue(e.target.value)}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button disabled={busy || !valid} onClick={save}>
            {t("Save email")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
