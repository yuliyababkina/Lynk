import { Eye, AlertTriangle, RefreshCw, Bell, Check, Send, type LucideIcon } from "lucide-react";

/** Icon per ticket primary action — shared by the Dashboard rows and the ticket drawer. */
export const ACTION_ICON: Record<string, LucideIcon> = {
  Review: Eye,
  Escalate: AlertTriangle,
  Renew: RefreshCw,
  Remind: Bell,
  Approve: Check,
  Request: Send,
};
