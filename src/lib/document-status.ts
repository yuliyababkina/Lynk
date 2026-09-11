import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Ban,
  FileX,
  type LucideIcon,
} from "lucide-react";
import type { DocStatus } from "../types";

/**
 * ONE definition of how a compliance document's state is presented, shared by
 * the Procurement Manager review, the supplier portal, and the prospect
 * onboarding wizard — so the same document never shows a different status
 * depending on who is looking at it.
 *
 * "missing" isn't a stored status: it's the absence of an upload for an expected
 * document type, surfaced the same way everywhere.
 */
export type DocDisplayStatus = DocStatus | "missing";

export interface DocStatusMeta {
  label: string;
  variant: string;
  Icon: LucideIcon;
  iconClass: string;
}

export const DOC_STATUS_META: Record<DocDisplayStatus, DocStatusMeta> = {
  valid: { label: "Approved", variant: "success-outline", Icon: CheckCircle2, iconClass: "text-success" },
  "warning-60": { label: "Expiring", variant: "orange-outline", Icon: AlertTriangle, iconClass: "text-chart-orange" },
  "warning-30": { label: "Expiring", variant: "warning-outline", Icon: AlertTriangle, iconClass: "text-warning" },
  "pending-review": { label: "Pending review", variant: "warning-outline", Icon: Clock, iconClass: "text-warning" },
  "rejected-resubmit": { label: "Declined", variant: "critical-outline", Icon: XCircle, iconClass: "text-destructive" },
  blocked: { label: "Blocked", variant: "critical-outline", Icon: Ban, iconClass: "text-destructive" },
  missing: { label: "Missing", variant: "neutral", Icon: FileX, iconClass: "text-muted-foreground" },
};

export function docStatusMeta(status?: DocStatus): DocStatusMeta {
  return DOC_STATUS_META[status ?? "missing"] ?? DOC_STATUS_META.missing;
}
