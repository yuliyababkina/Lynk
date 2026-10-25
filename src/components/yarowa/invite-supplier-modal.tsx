import { useEffect, useMemo, useState } from "react";
import {
  Mail, Building2, Tag, Search, ChevronRight, ChevronsUpDown, Check, X, Send,
  Link2, UserRoundCheck, Star, ShieldCheck,
} from "lucide-react";
import { COMPANY_DIRECTORY, TRADES } from "@/data";
import type { DirectoryCompany, InviteMatch, OnboardingCase } from "@/types";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/yarowa/toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PRINCIPAL_COMPANY, PROCUREMENT_MANAGER, PROCUREMENT_MANAGER_ROLE } from "@/lib/principal";

/* Step names are the English source: the wizard branches on them, and they are
   the dictionary keys, so they are translated only where they render. */
type StepName = "Contact" | "Details" | "Settings" | "Review";

function stepsFor(match: InviteMatch): StepName[] {
  if (match === "connected") return ["Contact"];
  if (match === "on-lynk") return ["Contact", "Settings", "Review"];
  return ["Contact", "Details", "Settings", "Review"];
}

const emailValid = (v: string) => /.+@.+\..+/.test(v.trim());

export function InviteSupplierModal({
  open,
  onClose,
  onCreateProspect,
}: {
  open: boolean;
  onClose: () => void;
  onCreateProspect: (c: OnboardingCase) => void;
}) {
  const [i, setI] = useState(0);
  const [company, setCompany] = useState("");
  const [picked, setPicked] = useState<DirectoryCompany | null>(null);
  const [dropdown, setDropdown] = useState(false);
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [trades, setTrades] = useState<string[]>([]);
  const [sendWelcome, setSendWelcome] = useState(true);
  const [requireChecklist, setRequireChecklist] = useState(true);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const { t } = useI18n();

  // Reset everything each time the modal is opened.
  useEffect(() => {
    if (open) {
      setI(0); setCompany(""); setPicked(null); setDropdown(false);
      setContact(""); setEmail(""); setTrades([]);
      setSendWelcome(true); setRequireChecklist(true); setNote(""); setSending(false);
    }
  }, [open]);

  const match: InviteMatch = picked?.state ?? "new";
  const steps = stepsFor(match);
  const stepIndex = Math.min(i, steps.length - 1);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const subtitle =
    match === "new"
      ? t("Send an onboarding invitation to a new supplier")
      : t("Search the platform or invite a new supplier by email");

  const companySuggestions = useMemo(() => {
    const q = company.trim().toLowerCase();
    return COMPANY_DIRECTORY.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [company]);

  function selectCompany(c: DirectoryCompany) {
    setPicked(c);
    setCompany(c.name);
    setDropdown(false);
    setI(0);
  }

  function typeCompany(v: string) {
    setCompany(v);
    const exact = COMPANY_DIRECTORY.find((c) => c.name.toLowerCase() === v.trim().toLowerCase());
    setPicked(exact ?? null);
  }

  function toggleTrade(t: string) {
    setTrades((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const canContinue =
    step === "Contact"
      ? match === "connected"
        ? true
        : match === "on-lynk"
          ? !!picked
          : company.trim().length > 0 && emailValid(email)
      : step === "Details"
        ? trades.length > 0
        : true;

  async function send() {
    setSending(true);
    try {
      if (match === "on-lynk") {
        // Connection requests aren't email invites — nothing to actually
        // send, this notifies an existing account inside the platform.
        await new Promise((r) => window.setTimeout(r, 900));
        toast({
          title: t("Connection request sent"),
          description: t("{company}'s account manager was notified.", { company }),
          tone: "success",
        });
      } else {
        const caseId = `onb-${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const inviteToken =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
        const magicLink = `${window.location.origin}/?invite=${inviteToken}`;

        if (sendWelcome) {
          const res = await fetch("/api/send-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email.trim(),
              companyName: company,
              contactName: contact.trim() || undefined,
              link: magicLink,
              note: note.trim() || undefined,
              // Same names the onboarding screen shows, so email and app agree.
              principal: PRINCIPAL_COMPANY,
              sender: PROCUREMENT_MANAGER,
              senderRole: PROCUREMENT_MANAGER_ROLE,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            // The server's own message wins when it sends one; it is already
            // written for the reader, and the seam for it is the mail service,
            // not this dictionary.
            throw new Error(body.error || t("Failed to send invitation email"));
          }
        }

        onCreateProspect({
          id: caseId,
          companyName: company,
          contactName: contact.trim() || "—",
          status: "Pending",
          daysNoResponse: 0,
          criticality: "low",
          email: email.trim(),
          inviteToken,
        });
        toast({
          title: sendWelcome ? t("Invitation sent") : t("Prospect added"),
          description: sendWelcome
            ? t("{company} added as a Prospect — invite emailed to {email}.", {
                company,
                email: email.trim(),
              })
            : t("{company} added as a Prospect — awaiting onboarding.", { company }),
          tone: "success",
        });
      }
      onClose();
    } catch (err) {
      toast({
        title: t("Couldn't send invitation"),
        description: err instanceof Error ? err.message : t("Please try again."),
        tone: "critical",
      });
    } finally {
      setSending(false);
    }
  }

  function primary() {
    if (match === "connected") return onClose();
    if (step === "Review") return send();
    setI((n) => n + 1);
  }

  /* Trades are reference data: English in the catalogue, German on the way out
     (the same entries the Suppliers Overview filters already translate). */
  const profileTrades = picked ? t(picked.trade) : trades.map((trade) => t(trade)).join(", ");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 sm:max-w-[560px] overflow-hidden rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold">{t("Invite Supplier")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">{subtitle}</DialogDescription>
          </div>
          <DialogClose asChild>
            <button className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={t("Close")}>
              <X size={18} />
            </button>
          </DialogClose>
        </div>

        {/* Stepper */}
        <div className="border-y border-border bg-secondary/30 px-5 py-3">
          <ol className="flex items-center gap-1.5 text-sm">
            {steps.map((s, idx) => {
              const done = idx < stepIndex;
              const current = idx === stepIndex;
              return (
                <li key={s} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      done && "bg-success text-success-foreground",
                      current && "bg-foreground text-background",
                      !done && !current && "bg-secondary text-muted-foreground"
                    )}
                  >
                    {done ? <Check size={14} /> : idx + 1}
                  </span>
                  <span className={cn("font-medium", current || done ? "text-foreground" : "text-muted-foreground")}>
                    {t(s)}
                  </span>
                  {idx < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground/50 mx-1" />}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Body */}
        <div className="px-5 py-5 min-h-[220px]">
          {sending ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-success-soft mb-4">
                <Send size={22} className="text-success-ink" />
              </span>
              <div className="font-semibold">
                {match === "on-lynk" ? t("Sending connection request…") : t("Sending invitation…")}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{match === "on-lynk" ? company : email}</div>
            </div>
          ) : step === "Contact" ? (
            <ContactStep
              company={company}
              onType={typeCompany}
              picked={picked}
              dropdown={dropdown}
              setDropdown={setDropdown}
              suggestions={companySuggestions}
              onSelect={selectCompany}
              contact={contact}
              setContact={setContact}
              email={email}
              setEmail={setEmail}
              match={match}
            />
          ) : step === "Details" ? (
            <DetailsStep trades={trades} toggle={toggleTrade} clear={() => setTrades([])} />
          ) : step === "Settings" ? (
            <SettingsStep
              match={match}
              sendWelcome={sendWelcome}
              setSendWelcome={setSendWelcome}
              requireChecklist={requireChecklist}
              setRequireChecklist={setRequireChecklist}
              note={note}
              setNote={setNote}
            />
          ) : (
            <ReviewStep
              match={match}
              company={company}
              contact={contact}
              email={email}
              trades={profileTrades}
              sendWelcome={sendWelcome}
              requireChecklist={requireChecklist}
            />
          )}
        </div>

        {/* Footer */}
        {!sending && (
          <div className="border-t border-border px-5 py-3 flex items-center justify-between">
            {stepIndex === 0 ? (
              <DialogClose asChild>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {t("Cancel")}
                </button>
              </DialogClose>
            ) : (
              <button
                onClick={() => setI((n) => n - 1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground"
              >
                <ChevronRight size={15} className="rotate-180" />
                {t("Back")}
              </button>
            )}

            {match === "connected" ? (
              <Button variant="outline" onClick={onClose}>{t("Close")}</Button>
            ) : (
              <Button onClick={primary} disabled={!canContinue}>
                {step === "Review" ? (
                  <>
                    <Send size={14} />
                    {match === "on-lynk" ? t("Send connection request") : t("Send Invitation")}
                  </>
                ) : (
                  <>
                    {t("Continue")}
                    <ChevronRight size={15} />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Steps ---------- */

function SectionLabel({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Icon size={15} />
      {children}
    </div>
  );
}

const fieldCls =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function ContactStep(props: {
  company: string;
  onType: (v: string) => void;
  picked: DirectoryCompany | null;
  dropdown: boolean;
  setDropdown: (v: boolean) => void;
  suggestions: DirectoryCompany[];
  onSelect: (c: DirectoryCompany) => void;
  contact: string;
  setContact: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  match: InviteMatch;
}) {
  const { company, onType, picked, dropdown, setDropdown, suggestions, onSelect, contact, setContact, email, setEmail, match } = props;
  const { t } = useI18n();
  return (
    <div>
      <SectionLabel icon={Mail}>{t("Who are you inviting?")}</SectionLabel>

      <label className="block text-sm font-medium mb-1">
        {t("Company name")}<span className="text-critical-ink">*</span>
      </label>
      <div className="relative">
        <input
          className={cn(fieldCls, "pr-9")}
          placeholder={t("Search or enter company name…")}
          value={company}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setDropdown(true)}
          onBlur={() => window.setTimeout(() => setDropdown(false), 120)}
        />
        <ChevronsUpDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        {dropdown && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
            {suggestions.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(c);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60"
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Platform match card */}
      {picked && match !== "new" && <MatchCard company={picked} match={match} />}

      {/* New-company fields only */}
      {match === "new" && (
        <>
          <label className="block text-sm font-medium mb-1 mt-4">{t("Contact person")}</label>
          <input className={fieldCls} placeholder={t("Full name")} value={contact} onChange={(e) => setContact(e.target.value)} />

          <label className="block text-sm font-medium mb-1 mt-4">
            {t("Email address")}<span className="text-critical-ink">*</span>
          </label>
          <input
            className={fieldCls}
            placeholder="contact@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </>
      )}
    </div>
  );
}

function MatchCard({ company, match }: { company: DirectoryCompany; match: InviteMatch }) {
  const { t } = useI18n();
  const onLynk = match === "on-lynk";
  return (
    <div className={cn("mt-4 rounded-lg p-3", onLynk ? "bg-medium-soft" : "bg-success-soft")}>
      <div className="flex gap-2.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", onLynk ? "bg-medium/15" : "bg-success/15")}>
          {onLynk ? <Link2 size={16} className="text-medium-ink" /> : <UserRoundCheck size={16} className="text-success-ink" />}
        </span>
        <div>
          {/* One sentence per state rather than a stitched-together phrase —
              German puts "bereits" where English puts "already". */}
          <div className={cn("text-sm font-semibold", onLynk ? "text-medium-ink" : "text-success-ink")}>
            {onLynk
              ? t("{company} is already on Lynk", { company: company.name })
              : t("{company} is already connected", { company: company.name })}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {onLynk
              ? t("This supplier has a verified profile. Sending a connection request will notify their account manager — no email invite needed.")
              : t("This supplier is active in your network. You can manage them in the Suppliers Catalogue.")}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-card p-2.5">
        <ShieldCheck size={18} className={cn("shrink-0", onLynk ? "text-medium-ink" : "text-success-ink")} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{company.name}</div>
          <div className="text-xs text-muted-foreground">
            {t(company.trade)} · {t(company.city)}
          </div>
        </div>
        {company.rating != null && (
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            <Star size={13} className="fill-current text-high" />
            {company.rating}
          </span>
        )}
        <span
          className={cn(
            "text-xs font-medium rounded-full px-2 py-0.5",
            onLynk ? "bg-medium/15 text-medium-ink" : "bg-success/15 text-success-ink"
          )}
        >
          {onLynk ? t("On Lynk") : t("Connected")}
        </span>
      </div>
    </div>
  );
}

function DetailsStep({
  trades,
  toggle,
  clear,
}: {
  trades: string[];
  toggle: (trade: string) => void;
  clear: () => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <SectionLabel icon={Building2}>{t("What trades does this supplier cover?")}</SectionLabel>
      <label className="block text-sm font-medium mb-1">
        {t("Trade")}<span className="text-critical-ink">*</span>
      </label>

      {/* Selected chips */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-md border border-border bg-card px-2.5 py-2 min-h-9">
        {trades.length === 0 ? (
          <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Search size={14} /> {t("Search trades…")}
          </span>
        ) : (
          trades.map((trade) => (
            <span key={trade} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
              {t(trade)}
              <button
                onClick={() => toggle(trade)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("Remove {trade}", { trade: t(trade) })}
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Checklist */}
      <div className="mt-2 rounded-md border border-border overflow-hidden">
        <ul className="max-h-[180px] overflow-y-auto">
          {TRADES.map((trade) => (
            <li key={trade}>
              <button
                type="button"
                onClick={() => toggle(trade)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary/50"
              >
                <Checkbox checked={trades.includes(trade)} tabIndex={-1} className="pointer-events-none" />
                {t(trade)}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs">
          <span className="text-muted-foreground">{t("{count} selected", { count: trades.length })}</span>
          <button onClick={clear} className="font-medium text-accent hover:underline">
            {t("Clear all")}
          </button>
        </div>
      </div>
      {trades.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">{t("Select at least one trade to continue")}</p>
      )}
    </div>
  );
}

function SettingsStep(props: {
  match: InviteMatch;
  sendWelcome: boolean;
  setSendWelcome: (v: boolean) => void;
  requireChecklist: boolean;
  setRequireChecklist: (v: boolean) => void;
  note: string;
  setNote: (v: string) => void;
}) {
  const { match, sendWelcome, setSendWelcome, requireChecklist, setRequireChecklist, note, setNote } = props;
  const { t } = useI18n();
  return (
    <div>
      <SectionLabel icon={Tag}>{t("Invitation settings")}</SectionLabel>

      {match === "new" && (
        <div className="space-y-3 mb-4">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox checked={sendWelcome} onCheckedChange={(v) => setSendWelcome(!!v)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{t("Send welcome email")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("The supplier receives a branded onboarding email with a portal link.")}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox checked={requireChecklist} onCheckedChange={(v) => setRequireChecklist(!!v)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{t("Require onboarding checklist")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("Supplier must complete profile, upload documents, and sign agreements.")}
              </span>
            </span>
          </label>
        </div>
      )}

      <label className="block text-sm font-medium mb-1">{t("Personal note (optional)")}</label>
      <textarea
        className={cn(fieldCls, "min-h-[88px] resize-none")}
        placeholder={
          match === "on-lynk"
            ? t("Add a short message for their account manager…")
            : t("Add a short message that will appear in the invitation email…")
        }
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}

/* The label is translated here rather than at each call site, the way the
   portal's Field does it — every row gets it from one place. */
function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{t(label)}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function ReviewStep(props: {
  match: InviteMatch;
  company: string;
  contact: string;
  email: string;
  trades: string;
  sendWelcome: boolean;
  requireChecklist: boolean;
}) {
  const { match, company, contact, email, trades, sendWelcome, requireChecklist } = props;
  const { t } = useI18n();
  const onLynk = match === "on-lynk";
  return (
    <div>
      <div className="rounded-lg border border-border bg-secondary/20 mb-3">
        <ReviewRow label="Company" value={company} />
        {!onLynk && <ReviewRow label="Contact" value={contact || "—"} />}
        {onLynk ? (
          <ReviewRow label="Action" value={t("Connection request")} />
        ) : (
          <ReviewRow label="Invitation email" value={email} />
        )}
        <ReviewRow label="Trades" value={trades || "—"} />
        {!onLynk && <ReviewRow label="Welcome email" value={sendWelcome ? t("Yes") : t("No")} />}
        {!onLynk && (
          <ReviewRow
            label="Onboarding checklist"
            value={requireChecklist ? t("Required") : t("Optional")}
          />
        )}
      </div>
      {/* Split on the unsubstituted slots so each language can put the emphasised
          company, address and stage where its own grammar needs them, instead of
          concatenating fragments — the same way the onboarding terms line does. */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {onLynk
          ? (() => {
              const [before, after = ""] = t(
                "A connection request will be sent to {company}'s account manager."
              ).split("{company}");
              return (
                <>
                  {before}
                  <span className="font-semibold text-foreground">{company}</span>
                  {after}
                </>
              );
            })()
          : (() => {
              const sentence = t(
                "An invitation will be sent to {email}. The company will appear as a {prospect} until they complete onboarding."
              );
              const [before, rest = ""] = sentence.split("{email}");
              const [middle, after = ""] = rest.split("{prospect}");
              return (
                <>
                  {before}
                  <span className="font-semibold text-foreground">{email}</span>
                  {middle}
                  <span className="font-semibold text-foreground">{t("Prospect")}</span>
                  {after}
                </>
              );
            })()}
      </p>
    </div>
  );
}
