/**
 * @custom   Requested-update email card with its confirm and update actions:
 *           sender row, subject and body, due strip, shared by Documents, Company
 *           Details and Requested Updates. shadcn has no message or email-card
 *           component. Composes Card, Badge, Button and Separator.
 * @approved Yuliya Babkina, 2026-11-12
 */

import { Award, Clock, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n-context";
import { Heading, Text } from "@/shared/ui/typography";
import type { RequestedUpdate } from "@/pages/portal/portal-data";

/*
 * The "Requested Updates" email card + action buttons. Shown as a right-hand rail
 * on the Documents and Company Details screens, and reused standalone. Renders one
 * request (subject, sender, body, due date) with the confirm / update actions.
 *
 * The card's chrome translates; the subject and body don't — they are the
 * principal's own words, which belong to the machine-translation seam.
 */
export function RequestedUpdatePanel({ update }: { update: RequestedUpdate }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h2>
        <Text variant="eyebrow" as="span">
          {t("Requested Updates")}
        </Text>
      </h2>

      <Card className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:0px] gap-0">
        {/* Sender */}
        <div className="flex items-start gap-3 p-4">
          <div className="w-8 h-8 rounded-full bg-warning-soft text-warning-ink flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <Heading level={4} as="div">
              {update.from} · {update.principal}
            </Heading>
            <p className="text-xs text-muted-foreground mt-0.5">
              {update.email} · {t(update.sentLabel)}
            </p>
          </div>
          <Badge variant="critical-outline" className="shrink-0">
            {t("Action required")}
          </Badge>
        </div>
        <Separator />

        {/* Subject + body */}
        <div className="p-4">
          <Heading level={3} className="leading-snug">{update.subject}</Heading>
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
          <Text variant="label" as="span" className="text-chart-orange-ink">{t(update.dueLabel)}</Text>
        </div>
      </Card>

      {/* Actions */}
      <Button variant="default" className="w-full">
        <Eye className="w-4 h-4" />
        {t("Review & update my details →")}
      </Button>
      <Button variant="outline" className="w-full">
        {t("Nothing has changed — confirm current details")}
      </Button>
    </div>
  );
}
