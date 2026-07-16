import { PencilLine, Upload, Send, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/yarowa/detail-drawer";
import type { ActivityItem, Tone } from "@/pages/portal/portal-data";

export interface PortalActivitySelection {
  item: ActivityItem;
  sectionLabel: string;
  tone: Tone;
}

const ACTION_ICON: Record<string, typeof PencilLine> = {
  Update: PencilLine,
  Complete: PencilLine,
  Upload: Upload,
  Chat: Send,
  Remind: Send,
  Review: CircleCheck,
};

function actionVariant(label: string): "dark" | "secondary" | "outline" {
  if (label === "Update" || label === "Upload" || label === "Complete") return "dark";
  if (label === "Chat") return "secondary";
  return "outline";
}

/*
 * Supplier Portal counterpart to TicketDrawer — opens on the right when an
 * Overview activity row is clicked. Shares the DetailDrawer shell so it slides in
 * identically, but carries the supplier's own content and actions.
 */
export function PortalActivityDrawer({
  selection,
  onClose,
}: {
  selection: PortalActivitySelection;
  onClose: () => void;
}) {
  const { item, sectionLabel, tone } = selection;
  return (
    <DetailDrawer onClose={onClose} header={<Badge variant={tone as any}>{sectionLabel}</Badge>}>
      <h3 className="font-semibold text-base mb-1">{item.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{item.detail}</p>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div>
          <div className="text-muted-foreground mb-0.5">PRINCIPAL</div>
          <div className="font-medium">{item.principal}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-0.5">UPDATED</div>
          <div className="font-medium">{item.ageLabel}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-4">
        <div className="mb-1 font-medium text-foreground">What needs attention</div>
        Review this item and take the recommended action below.
      </div>

      <div className="flex flex-col gap-2">
        {item.actions.map((a) => {
          const Icon = ACTION_ICON[a];
          return (
            <Button key={a} variant={actionVariant(a)} className="w-full">
              {Icon && <Icon size={14} />}
              {a}
            </Button>
          );
        })}
      </div>
    </DetailDrawer>
  );
}
