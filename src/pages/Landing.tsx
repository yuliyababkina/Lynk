import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-context";
import { LanguageToggle } from "@/components/yarowa/language-toggle";
import { Heading, Text } from "@/shared/ui/typography";

// The logo tile shows the initial of the product name: a brand mark, not translatable text.
const BRAND_INITIAL = "Lynk".charAt(0);

export type LandingRole = "pm" | "supplier" | "prospect";

export interface LandingProps {
  onSelectRole: (role: LandingRole) => void;
}

interface RoleCard {
  id: LandingRole;
  name: string;
  pill: string;
  description: string;
  cta: string;
  icon: string;
}

const ROLES: RoleCard[] = [
  {
    id: "pm",
    name: "Sabine Müller",
    pill: "Procurement Manager",
    description:
      "Dashboard, compliance monitoring, contract management, data governance, qualification, reporting.",
    cta: "Open Procurement Dashboard",
    icon: "👩‍💼",
  },
  {
    id: "supplier",
    name: "Martin Weber",
    pill: "Supplier · EuroBau Components",
    description:
      "Manage compliance documents, request sensitive data changes, view performance ratings and score history.",
    cta: "Open Supplier Account",
    icon: "🏭",
  },
  {
    id: "prospect",
    name: "Mehmet Yilmaz",
    pill: "Prospect · Yilmaz Elektrotechnik",
    description:
      "New supplier invited to the platform. Complete profile, upload compliance documents, go through onboarding.",
    cta: "Open Onboarding Portal",
    icon: "🔧",
  },
];

export function Landing({ onSelectRole }: LandingProps) {
  const { t } = useI18n();
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute top-5 right-5">
        <LanguageToggle />
      </div>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {BRAND_INITIAL}
          </div>
          <Heading level={1} as="span">Lynk</Heading>
        </div>
        <Heading level={1} className="tracking-tight">{t("Supplier Management Platform")}</Heading>
        <p className="text-muted-foreground mt-3">{t("Three distinct user experiences within the same workflow.")}</p>
        <p className="text-muted-foreground">{t("Choose a role to explore.")}</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full">
        {ROLES.map((role) => (
          <div
            key={role.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRole(role.id)}
            className="p-6 rounded-2xl cursor-pointer transition-all bg-card border border-border shadow-none hover:border-foreground/20 hover:shadow-md"
          >
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 bg-secondary-brand">
              {role.icon}
            </div>

            {/* Name */}
            <Heading level={2}>{role.name}</Heading>

            {/* Role pill */}
            <Badge variant="secondary" className="mt-2">
              {t(role.pill)}
            </Badge>

            {/* Description */}
            <p className="text-sm leading-relaxed mt-4 text-muted-foreground">{t(role.description)}</p>

            {/* CTA */}
            <Text variant="label" as="span" className="inline-flex items-center gap-1.5 mt-6 text-primary">
              {t(role.cta)}
              <ArrowRight className="w-4 h-4" />
            </Text>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl">
        {t("In production these would be separate authenticated sessions. This demo simulates all three.")}
      </p>
    </div>
  );
}
