/**
 * @custom   Body of one master-data change request: the supplier's stated
 *           reason, each changing field as Before / After (sensitive fields
 *           flagged, masked values as stored) and the four-eyes progress. The
 *           Data Governance card and the ticket panel render this same
 *           component — "split" Before|After side by side in the wide card,
 *           "stacked" in the 380px panel. Composes Badge.
 * @approved Yuliya Babkina, 2026-11-25
 */
import { ChevronRight, Lock } from "lucide-react";
import type { DataGovernanceRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { Text } from "@/shared/ui/typography";

type StepState = "done" | "current" | "waiting";

function stepStates(r: DataGovernanceRequest): [StepState, StepState] {
  switch (r.status) {
    case "Awaiting Review":
      return ["current", "waiting"];
    case "Endorsed — Awaiting 2nd Approval":
      return ["done", "current"];
    case "Approved":
      return ["done", "done"];
    default:
      // Rejected: the step it was stopped at is the last one reached.
      return r.approvalStep >= 2 ? ["done", "waiting"] : ["waiting", "waiting"];
  }
}

const STEP_VARIANT = { done: "success", current: "info", waiting: "neutral" } as const;

export function DataChangeBody({
  request,
  layout = "split",
}: {
  request: DataGovernanceRequest;
  /** "stacked" puts After under Before, for the 380px panel. */
  layout?: "split" | "stacked";
}) {
  const { t } = useI18n();
  const [first, second] = stepStates(request);

  return (
    <div className="space-y-3">
      <div>
        <Text variant="eyebrow" as="div" className="mb-1">
          {t("Supplier's stated reason")}
        </Text>
        <Text as="div">{request.reason}</Text>
      </div>

      <Text variant="eyebrow" as="div">
        {t("{count} fields changing", { count: request.fields.length })}
      </Text>
      <div className="space-y-2">
        {request.fields.map((f) => (
          <div key={f.label} className="overflow-hidden rounded-xl border border-border">
            <Text variant="label" as="div" className="flex items-center justify-between bg-secondary/60 px-3 py-1.5">
              {t(f.label)}
              {f.sensitive && (
                <span className="flex items-center gap-1 text-warning-ink">
                  <Lock size={11} /> {t("Sensitive")}
                </span>
              )}
            </Text>
            <div
              className={cn(
                layout === "split" ? "grid grid-cols-2 divide-x divide-border" : "divide-y divide-border"
              )}
            >
              <div className="px-3 py-2">
                <Text variant="small" as="div">{t("Before")}</Text>
                <div className="break-all font-mono text-xs">{f.before}</div>
              </div>
              <div className="bg-success/10 px-3 py-2">
                <Text variant="small" as="div">{t("After")}</Text>
                <div className="break-all font-mono text-xs">{f.after}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Text variant="small" as="div" className="mb-1">
          {t("Four-eyes approval progress")}
        </Text>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={STEP_VARIANT[first]}>{t("1. First Review")}</Badge>
          <ChevronRight size={14} className="text-muted-foreground" aria-hidden="true" />
          <Badge variant={STEP_VARIANT[second]}>{t("2. Final Approval")}</Badge>
        </div>
      </div>
    </div>
  );
}
