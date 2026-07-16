import { Card } from "@/components/ui/card";
import { AlertBanner } from "@/components/yarowa/alert-banner";
import type { SupplierPrincipalRelationship } from "@/types";
import { SUPPLIER_RELATIONSHIPS_MARTIN } from "@/data";

export interface PortalOverviewProps {
  supplierId: string;
}

export function PortalOverview({ supplierId }: PortalOverviewProps) {
  // Mock data - in reality, would query based on supplierId
  const relationships = SUPPLIER_RELATIONSHIPS_MARTIN;
  const totalPending = relationships.reduce((sum, r) => sum + r.pendingCount, 0);
  const totalRejected = relationships.reduce((sum, r) => sum + r.rejectedCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">Good morning, Martin</h1>
        <p className="text-muted-foreground mt-1">Welcome back to your supplier account</p>
      </div>

      {/* Alert if pending */}
      {totalPending > 0 && (
        <AlertBanner
          title="Action Required"
          description={`You have ${totalPending} document(s) or request(s) pending review from your principals.`}
          tone="warning"
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Principals</p>
          <p className="text-2xl font-semibold">{relationships.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Active relationships</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-semibold text-orange-500">{totalPending}</p>
          <p className="text-xs text-muted-foreground mt-2">Documents / requests</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Changes Requested</p>
          <p className="text-2xl font-semibold text-red-500">{totalRejected}</p>
          <p className="text-xs text-muted-foreground mt-2">Resubmit required</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Compliance</p>
          <p className="text-2xl font-semibold text-green-500">92%</p>
          <p className="text-xs text-muted-foreground mt-2">Across principals</p>
        </Card>
      </div>

      {/* Action required section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Action Required</h2>
        <div className="space-y-3">
          {relationships
            .filter((r) => r.pendingCount > 0)
            .map((relationship) => (
              <Card key={relationship.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{relationship.principalName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {relationship.pendingCount} document(s) or request(s) need your attention
                    </p>
                    {relationship.lastMessage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {relationship.lastMessage.from}: "{relationship.lastMessage.text}"
                      </p>
                    )}
                  </div>
                  <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90">
                    Review
                  </button>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Compliance by principal */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Compliance by Principal</h2>
        <div className="space-y-3">
          {relationships.map((relationship) => {
            const valid = Math.max(0, 5 - relationship.rejectedCount);
            const total = 5;
            return (
              <div key={relationship.id}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">{relationship.principalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {valid}/{total}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(valid / total) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
