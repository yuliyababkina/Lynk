import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export interface PortalOnboardingProps {
  supplierId: string;
}

export function PortalOnboarding({ supplierId }: PortalOnboardingProps) {
  const { t } = useI18n();
  return (
    <div className="p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t("Onboarding Coming Soon")}</h1>
        <p className="text-muted-foreground">
          {t("The onboarding wizard for prospect relationships will be built here.")}
        </p>
      </Card>
    </div>
  );
}
