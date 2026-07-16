import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUPPLIER_RELATIONSHIPS_MARTIN } from "@/data";

export interface PortalPrincipalsProps {
  supplierId: string;
}

export function PortalPrincipals({ supplierId }: PortalPrincipalsProps) {
  // Mock data
  const relationships = SUPPLIER_RELATIONSHIPS_MARTIN;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "supplier":
        return "success";
      case "prospect":
        return "warning";
      case "provider":
        return "primary";
      default:
        return "neutral";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Principals</h1>
        <p className="text-muted-foreground mt-1">Companies you work with or are onboarding with</p>
      </div>

      <div className="space-y-3">
        {relationships.map((relationship) => (
          <Card key={relationship.id} className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{relationship.principalName}</h3>
                  <Badge variant={getStatusColor(relationship.status) as any}>
                    {relationship.status.charAt(0).toUpperCase() + relationship.status.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Pending</p>
                    <p className="text-lg font-semibold">{relationship.pendingCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Changes Requested</p>
                    <p className="text-lg font-semibold text-red-500">{relationship.rejectedCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unread Messages</p>
                    <p className="text-lg font-semibold">{relationship.unreadCount}</p>
                  </div>
                </div>
                {relationship.lastMessage && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">{relationship.lastMessage.from}:</span> {relationship.lastMessage.text}
                  </p>
                )}
              </div>
              <button className="ml-4 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90">
                View
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
