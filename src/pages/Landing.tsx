import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  dark?: boolean;
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
    dark: true,
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
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            L
          </div>
          <span className="text-2xl font-semibold">Lynk</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Supplier Management Platform</h1>
        <p className="text-muted-foreground mt-3">Three distinct user experiences within the same workflow.</p>
        <p className="text-muted-foreground">Choose a role to explore.</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full">
        {ROLES.map((role) => (
          <Card
            key={role.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRole(role.id)}
            className={cn(
              "p-6 rounded-2xl [--card-spacing:0px] gap-0 cursor-pointer transition-all",
              role.dark
                ? "bg-brand-navy text-white border-transparent ring-0 hover:shadow-lg"
                : "bg-card border border-border ring-0 shadow-none hover:border-foreground/20 hover:shadow-md"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4",
                role.dark ? "bg-emerald-500/15" : "bg-success-soft"
              )}
            >
              {role.icon}
            </div>

            {/* Name */}
            <h2 className="text-lg font-semibold">{role.name}</h2>

            {/* Role pill */}
            <Badge
              variant={role.dark ? "secondary" : "success"}
              className={cn("mt-2", role.dark && "bg-emerald-500/15 text-emerald-300 border-transparent")}
            >
              {role.pill}
            </Badge>

            {/* Description */}
            <p className={cn("text-sm leading-relaxed mt-4", role.dark ? "text-white/70" : "text-muted-foreground")}>
              {role.description}
            </p>

            {/* CTA */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium mt-6",
                role.dark ? "text-emerald-400" : "text-primary"
              )}
            >
              {role.cta}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Card>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl">
        In production these would be separate authenticated sessions. This demo simulates all three.
      </p>
    </div>
  );
}
