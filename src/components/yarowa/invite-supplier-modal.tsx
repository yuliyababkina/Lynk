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
      ? "Send an onboarding invitation to a new supplier"
      : "Search the platform or invite a new supplier by email";

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

  function send() {
    setSending(true);
    window.setTimeout(() => {
      if (match === "on-lynk") {
        toast({
          title: "Connection request sent",
          description: `${company}'s account manager was notified.`,
          tone: "success",
        });
      } else {
        onCreateProspect({
          id: `onb-${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          companyName: company,
          contactName: contact.trim() || "—",
          status: "Pending",
          daysNoResponse: 0,
          criticality: "low",
        });
        toast({
          title: "Invitation sent",
          description: `${company} added as a Prospect — awaiting onboarding.`,
          tone: "success",
        });
      }
      onClose();
    }, 1200);
  }

  function primary() {
    if (match === "connected") return onClose();
    if (step === "Review") return send();
    setI((n) => n + 1);
  }

  const profileTrades = picked ? picked.trade : trades.join(", ");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 sm:max-w-[560px] overflow-hidden rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold">Invite Supplier</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">{subtitle}</DialogDescription>
          </div>
          <DialogClose asChild>
            <button className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Close">
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
                    {s}
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
                {match === "on-lynk" ? "Sending connection request…" : "Sending invitation…"}
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
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
              </DialogClose>
            ) : (
              <button
                onClick={() => setI((n) => n - 1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground"
              >
                <ChevronRight size={15} className="rotate-180" />
                Back
              </button>
            )}

            {match === "connected" ? (
              <Button variant="outline" onClick={onClose}>Close</Button>
            ) : (
              <Button onClick={primary} disabled={!canContinue}>
                {step === "Review" ? (
                  <>
                    <Send size={14} />
                    {match === "on-lynk" ? "Send connection request" : "Send Invitation"}
                  </>
                ) : (
                  <>
                    Continue
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
  return (
    <div>
      <SectionLabel icon={Mail}>Who are you inviting?</SectionLabel>

      <label className="block text-sm font-medium mb-1">
        Company name<span className="text-critical-ink">*</span>
      </label>
      <div className="relative">
        <input
          className={cn(fieldCls, "pr-9")}
          placeholder="Search or enter company name…"
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
          <label className="block text-sm font-medium mb-1 mt-4">Contact person</label>
          <input className={fieldCls} placeholder="Full name" value={contact} onChange={(e) => setContact(e.target.value)} />

          <label className="block text-sm font-medium mb-1 mt-4">
            Email address<span className="text-critical-ink">*</span>
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
  const onLynk = match === "on-lynk";
  return (
    <div className={cn("mt-4 rounded-lg p-3", onLynk ? "bg-medium-soft" : "bg-success-soft")}>
      <div className="flex gap-2.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", onLynk ? "bg-medium/15" : "bg-success/15")}>
          {onLynk ? <Link2 size={16} className="text-medium-ink" /> : <UserRoundCheck size={16} className="text-success-ink" />}
        </span>
        <div>
          <div className={cn("text-sm font-semibold", onLynk ? "text-medium-ink" : "text-success-ink")}>
            {company.name} is already {onLynk ? "on Lynk" : "connected"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {onLynk
              ? "This supplier has a verified profile. Sending a connection request will notify their account manager — no email invite needed."
              : "This supplier is active in your network. You can manage them in the Suppliers Catalogue."}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-card p-2.5">
        <ShieldCheck size={18} className={cn("shrink-0", onLynk ? "text-medium-ink" : "text-success-ink")} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{company.name}</div>
          <div className="text-xs text-muted-foreground">
            {company.trade} · {company.city}
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
          {onLynk ? "On Lynk" : "Connected"}
        </span>
      </div>
    </div>
  );
}

function DetailsStep({ trades, toggle, clear }: { trades: string[]; toggle: (t: string) => void; clear: () => void }) {
  return (
    <div>
      <SectionLabel icon={Building2}>What trades does this supplier cover?</SectionLabel>
      <label className="block text-sm font-medium mb-1">
        Trade<span className="text-critical-ink">*</span>
      </label>

      {/* Selected chips */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-md border border-border bg-card px-2.5 py-2 min-h-9">
        {trades.length === 0 ? (
          <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Search size={14} /> Search trades…
          </span>
        ) : (
          trades.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
              {t}
              <button onClick={() => toggle(t)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${t}`}>
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Checklist */}
      <div className="mt-2 rounded-md border border-border overflow-hidden">
        <ul className="max-h-[180px] overflow-y-auto">
          {TRADES.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => toggle(t)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary/50"
              >
                <Checkbox checked={trades.includes(t)} tabIndex={-1} className="pointer-events-none" />
                {t}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs">
          <span className="text-muted-foreground">{trades.length} selected</span>
          <button onClick={clear} className="font-medium text-accent hover:underline">Clear all</button>
        </div>
      </div>
      {trades.length === 0 && <p className="text-xs text-muted-foreground mt-2">Select at least one trade to continue</p>}
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
  return (
    <div>
      <SectionLabel icon={Tag}>Invitation settings</SectionLabel>

      {match === "new" && (
        <div className="space-y-3 mb-4">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox checked={sendWelcome} onCheckedChange={(v) => setSendWelcome(!!v)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">Send welcome email</span>
              <span className="block text-xs text-muted-foreground">The supplier receives a branded onboarding email with a portal link.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox checked={requireChecklist} onCheckedChange={(v) => setRequireChecklist(!!v)} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">Require onboarding checklist</span>
              <span className="block text-xs text-muted-foreground">Supplier must complete profile, upload documents, and sign agreements.</span>
            </span>
          </label>
        </div>
      )}

      <label className="block text-sm font-medium mb-1">Personal note (optional)</label>
      <textarea
        className={cn(fieldCls, "min-h-[88px] resize-none")}
        placeholder={
          match === "on-lynk"
            ? "Add a short message for their account manager…"
            : "Add a short message that will appear in the invitation email…"
        }
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
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
  const onLynk = match === "on-lynk";
  return (
    <div>
      <div className="rounded-lg border border-border bg-secondary/20 mb-3">
        <ReviewRow label="Company" value={company} />
        {!onLynk && <ReviewRow label="Contact" value={contact || "—"} />}
        {onLynk ? (
          <ReviewRow label="Action" value="Connection request" />
        ) : (
          <ReviewRow label="Invitation email" value={email} />
        )}
        <ReviewRow label="Trades" value={trades || "—"} />
        {!onLynk && <ReviewRow label="Welcome email" value={sendWelcome ? "Yes" : "No"} />}
        {!onLynk && <ReviewRow label="Onboarding checklist" value={requireChecklist ? "Required" : "Optional"} />}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {onLynk ? (
          <>A connection request will be sent to <span className="font-semibold text-foreground">{company}</span>'s account manager.</>
        ) : (
          <>
            An invitation will be sent to <span className="font-semibold text-foreground">{email}</span>. The company will appear
            as a <span className="font-semibold text-foreground">Prospect</span> until they complete onboarding.
          </>
        )}
      </p>
    </div>
  );
}
