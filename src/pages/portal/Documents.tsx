import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOCS } from "@/data";

export interface PortalDocumentsProps {
  supplierId: string;
}

export function PortalDocuments({ supplierId }: PortalDocumentsProps) {
  // Filter docs for this supplier
  const docs = DOCS.filter((d) => d.supplierId === supplierId || supplierId === "supplier_martin_weber");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "success";
      case "pending-review":
        return "warning";
      case "rejected-resubmit":
        return "critical";
      case "blocked":
        return "critical";
      case "warning-30":
      case "warning-60":
        return "warning";
      default:
        return "neutral";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "valid":
        return "Valid";
      case "pending-review":
        return "Pending Review";
      case "rejected-resubmit":
        return "Changes Requested";
      case "blocked":
        return "Blocked";
      case "warning-30":
        return "Expires in 30 days";
      case "warning-60":
        return "Expires in 60 days";
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-muted-foreground mt-1">Compliance documents shared across all your principal relationships</p>
      </div>

      <div className="space-y-3">
        {docs.map((doc) => (
          <Card key={doc.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{doc.documentName}</h3>
                  <Badge variant={getStatusColor(doc.status) as any}>
                    {getStatusLabel(doc.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{doc.documentCategory || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium">{doc.expiryDate || "No expiry"}</p>
                  </div>
                </div>
                {doc.statusNote && <p className="text-xs text-muted-foreground italic">"{doc.statusNote}"</p>}
              </div>
              {doc.status === "rejected-resubmit" && (
                <button className="ml-4 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90">
                  Upload Renewal
                </button>
              )}
              {doc.fileUrl && (
                <button className="ml-4 px-3 py-1.5 border border-border rounded text-sm font-medium hover:bg-accent">
                  View
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
