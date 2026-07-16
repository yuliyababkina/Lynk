import { Award, Clock, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RequestedUpdate } from "@/pages/portal/portal-data";

/*
 * The "Requested Updates" email card + action buttons. Shown as a right-hand rail
 * on the Documents and Company Details screens, and reused standalone. Renders one
 * request (subject, sender, body, due date) with the confirm / update actions.
 */
export function RequestedUpdatePanel({ update }: { update: RequestedUpdate }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requested Updates</h2>

      <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:0px] gap-0">
        {/* Sender */}
        <div className="flex items-start gap-3 p-4">
          <div className="w-8 h-8 rounded-full bg-warning-soft text-warning-ink flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {update.from} · {update.principal}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {update.email} · {update.sentLabel}
            </p>
          </div>
          <Badge variant="critical-outline" className="shrink-0">
            Action required
          </Badge>
        </div>
        <Separator />

        {/* Subject + body */}
        <div className="p-4">
          <h3 className="text-base font-semibold leading-snug">{update.subject}</h3>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            {update.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Due strip */}
        <Separator />
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
          <Clock className="w-3.5 h-3.5 text-chart-orange-ink" />
          <span className="text-xs font-medium text-chart-orange-ink">{update.dueLabel}</span>
        </div>
      </Card>

      {/* Actions */}
      <Button variant="dark" className="w-full">
        <Eye className="w-4 h-4" />
        Review &amp; update my details →
      </Button>
      <Button variant="outline" className="w-full">
        Nothing has changed — confirm current details
      </Button>
    </div>
  );
}
