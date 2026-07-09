import type { ToastTone } from "@/components/yarowa/toast";

/*
 * Maps a ticket's primary action verb to the confirmation shown once it's
 * resolved. One place to keep action wording + tone consistent across the
 * dashboard cards and the ticket drawer.
 */
export const ACTION_RESULT: Record<string, { title: string; tone: ToastTone }> = {
  Review: { title: "Marked as reviewed", tone: "success" },
  Approve: { title: "Approved", tone: "success" },
  Renew: { title: "Renewal started", tone: "default" },
  Remind: { title: "Reminder sent", tone: "default" },
  Request: { title: "Request sent", tone: "default" },
  Escalate: { title: "Escalated to manager", tone: "warning" },
};

export function actionResult(action: string) {
  return ACTION_RESULT[action] ?? { title: `${action} done`, tone: "default" as ToastTone };
}
