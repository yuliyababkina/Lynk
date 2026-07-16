import { Card } from "@/components/ui/card";

export interface PortalOnboardingProps {
  supplierId: string;
}

export function PortalOnboarding({ supplierId }: PortalOnboardingProps) {
  return (
    <div className="p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">Onboarding Coming Soon</h1>
        <p className="text-muted-foreground">The onboarding wizard for prospect relationships will be built here.</p>
      </Card>
    </div>
  );
}
