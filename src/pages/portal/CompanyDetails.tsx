import { Building2, MapPin, Wallet, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { WizardFooter } from "@/components/yarowa/wizard-footer";
import { getPortalProfile, type CompanyDetails } from "./portal-data";

export interface PortalCompanyDetailsProps {
  supplierId: string;
  /** Live company record, carrying any edits saved from the Overview panel. */
  company?: CompanyDetails;
}

/**
 * Read-only by default — the page still presents the profile as a record rather
 * than a form. `readOnly={false}` turns the same field into an editable input so
 * the activity panel can reuse it without a second visual language.
 */
export function Field({
  label,
  value,
  mono,
  readOnly = true,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  mono?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        readOnly={readOnly}
        value={value}
        placeholder={placeholder}
        onChange={onChange && ((e) => onChange(e.target.value))}
        className={cn("h-10 rounded-lg border-border bg-background", mono && "font-mono")}
      />
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof Building2;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:1.25rem] px-(--card-spacing) gap-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function PortalCompanyDetails({ supplierId, company: live }: PortalCompanyDetailsProps) {
  const profile = getPortalProfile(supplierId);
  const { requestedUpdates } = profile;
  const company = live ?? profile.company;
  const { address, payment } = company;
  const activeUpdate = requestedUpdates[0];

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* Company details form */}
      <section className="flex-1 min-w-0 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Company Details</h1>
          <p className="text-muted-foreground mt-1">
            Legal profile, registered address, and payment data shared with principals.
          </p>
        </div>

        <SectionCard
          icon={Building2}
          title="Company Details"
          action={
            <Badge variant="secondary">
              <Lock className="w-3 h-3" />
              Read only
            </Badge>
          }
        >
          <div className="space-y-4">
            <Field label="Legal Name" value={company.legalName} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="VAT ID" value={company.vatId} />
              <Field label="Registration No." value={company.registrationNo} />
            </div>
            <Field label="Website" value={company.website} />
          </div>
        </SectionCard>

        {/* Associate selector */}
        <Button variant="ghost" className="h-auto px-2 py-1 text-lg font-semibold gap-2">
          Associate: {company.associate}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>

        <SectionCard icon={MapPin} title="Registered Address">
          <div className="space-y-4">
            <Field label="Street" value={address.street} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" value={address.city} />
              <Field label="Postcode" value={address.postcode} />
            </div>
            <Field label="Country" value={address.country} />
          </div>
        </SectionCard>

        <SectionCard icon={Building2} title="Primary Contact">
          <div className="space-y-4">
            <Field label="Contact person" value={company.contact.name || "—"} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact email" value={company.contact.email || "—"} />
              <Field label="Contact phone" value={company.contact.phone || "—"} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Wallet}
          title="Payment Data"
          action={
            <Badge variant="critical-outline">
              <Lock className="w-3 h-3" />
              Sensitive
            </Badge>
          }
        >
          <div className="space-y-4">
            <Field label="IBAN" value={payment.iban} mono />
            <Field label="Bank Name" value={payment.bankName} />
            <Field label="BIC / SWIFT" value={payment.bic} mono />
          </div>
        </SectionCard>

        <WizardFooter>
          <Button variant="dark">Update My Details →</Button>
        </WizardFooter>
      </section>

      {/* Requested updates rail */}
      {activeUpdate && (
        <aside className="lg:w-[440px] shrink-0 p-6 border-t lg:border-t-0 lg:border-l border-border bg-card">
          <RequestedUpdatePanel update={activeUpdate} />
        </aside>
      )}
    </div>
  );
}
