import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n-context";
import { Heading } from "@/shared/ui/typography";

export interface PortalOnboardingProps {
  supplierId: string;
}

export function PortalOnboarding({ supplierId: _supplierId }: PortalOnboardingProps) {
  const { t } = useI18n();
  return (
    <div className="p-6">
      <Card className="p-6">
        <Heading level={1} className="mb-2">{t("Onboarding Coming Soon")}</Heading>
        <p className="text-muted-foreground">
          {t("The onboarding wizard for prospect relationships will be built here.")}
        </p>
      </Card>
    </div>
  );
}
