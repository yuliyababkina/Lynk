import { Building2, MapPin, Wallet, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequestedUpdatePanel } from "@/components/yarowa/requested-update-panel";
import { getPortalProfile } from "./portal-data";

export interface PortalCompanyDetailsProps {
  supplierId: string;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        readOnly
        value={value}
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
    <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:0px] p-5 gap-0">
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

export function PortalCompanyDetails({ supplierId }: PortalCompanyDetailsProps) {
  const profile = getPortalProfile(supplierId);
  const { company, requestedUpdates } = profile;
  const { address, payment } = company;
  const activeUpdate = requestedUpdates[0];

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* Company details form */}
      <section className="flex-1 min-w-0 p-6 space-y-6 max-w-2xl">
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

        <Button variant="dark" size="lg" className="w-full">
          Update My Details →
        </Button>
      </section>

      {/* Requested updates rail */}
      {activeUpdate && (
        <aside className="lg:w-[440px] shrink-0 p-6 border-t lg:border-t-0 lg:border-l border-border">
          <RequestedUpdatePanel update={activeUpdate} />
        </aside>
      )}
    </div>
  );
}
