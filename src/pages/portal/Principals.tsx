import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLynkData } from "@/lib/LynkDataContext";
import { relationshipId } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { SUPPLIER_RELATIONSHIPS_MARTIN, SUPPLIER_RELATIONSHIPS_MEHMET } from "@/data";
import type { SupplierPrincipalRelationship } from "@/types";

export interface PortalPrincipalsProps {
  supplierId: string;
  /** Opens the conversation with one principal. */
  onOpenChat?: (relationship: string, principalName: string) => void;
}

/** Each persona's own set of principals, instead of always showing Martin's. */
function relationshipsFor(supplierId: string): SupplierPrincipalRelationship[] {
  return supplierId === "supplier_mehmet_yilmaz"
    ? SUPPLIER_RELATIONSHIPS_MEHMET
    : SUPPLIER_RELATIONSHIPS_MARTIN;
}

export function PortalPrincipals({ supplierId, onOpenChat }: PortalPrincipalsProps) {
  const { t } = useI18n();
  const { unreadFor, lastMessageFor } = useLynkData();
  const relationships = relationshipsFor(supplierId);

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
        {relationships.map((relationship) => {
          /* The conversation key is derived from the two parties, so this page
             can only ever address its own relationships — and each principal's
             thread stays separate even though one account sees them all. */
          const conversation = relationshipId(relationship.principalId, supplierId);
          const unread = unreadFor(conversation, "supplier");
          const last = lastMessageFor(conversation);

          return (
            <Card key={relationship.id} className="p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{relationship.principalName}</h3>
                    <Badge variant={getStatusColor(relationship.status) as never}>
                      {t(relationship.status.charAt(0).toUpperCase() + relationship.status.slice(1))}
                    </Badge>
                    {unread > 0 && (
                      <Badge variant="critical">{t("{count} unread", { count: unread })}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="text-lg font-semibold">{relationship.pendingCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Changes Requested</p>
                      <p className="text-lg font-semibold text-destructive">{relationship.rejectedCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("Messages")}</p>
                      <p className="text-lg font-semibold">{unread}</p>
                    </div>
                  </div>
                  {/* The real last message, not a mock string. */}
                  {last && (
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">
                        {last.authorSide === "supplier" ? t("You") : last.authorName}:
                      </span>{" "}
                      {last.body}
                    </p>
                  )}
                </div>
                <Button
                  variant={unread > 0 ? "dark" : "outline"}
                  className="ml-4 shrink-0"
                  onClick={() => onOpenChat?.(conversation, relationship.principalName)}
                  aria-label={t("Message {company}", { company: relationship.principalName })}
                >
                  <MessageSquare className="w-4 h-4" />
                  {t("Chat")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
