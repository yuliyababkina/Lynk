import { Card } from "@/components/ui/card";
import { AlertBanner } from "@/components/yarowa/alert-banner";

export interface PortalRequestedUpdatesProps {
  supplierId: string;
}

export function PortalRequestedUpdates({ supplierId }: PortalRequestedUpdatesProps) {
  // Mock requested updates
  const updates = [
    {
      id: "update_1",
      principal: "Wincasa",
      title: "Update Banking Details",
      reason: "Annual compliance verification",
      fields: ["Account Holder Name", "IBAN", "BIC"],
      dueDate: "2026-08-15",
    },
    {
      id: "update_2",
      principal: "AT Immobilien",
      title: "Verify Contact Information",
      reason: "Contact details outdated in our system",
      fields: ["Primary Contact", "Email", "Phone"],
      dueDate: "2026-07-30",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Requested Updates</h1>
        <p className="text-muted-foreground mt-1">Information your principals have requested you to verify or update</p>
      </div>

      {updates.length === 0 ? (
        <AlertBanner title="No pending updates" description="All information is up to date." tone="success" />
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <Card key={update.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-primary">{update.principal}</p>
                  </div>
                  <h3 className="font-semibold text-base">{update.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-sm font-semibold">{update.dueDate}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{update.reason}</p>

              <div className="bg-muted p-3 rounded mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">FIELDS REQUESTED</p>
                <div className="flex flex-wrap gap-2">
                  {update.fields.map((field) => (
                    <div key={field} className="bg-background px-2 py-1 rounded text-xs font-medium">
                      {field}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90">
                  Review & Update
                </button>
                <button className="flex-1 px-3 py-2 border border-border rounded text-sm font-medium hover:bg-accent">
                  No changes needed
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
