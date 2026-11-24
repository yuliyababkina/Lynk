import { useCallback } from "react";
import type { OnboardingCase } from "@/types";
import { toast } from "@/lib/toast";
import { useI18n } from "@/lib/i18n-context";
import { PRINCIPAL_COMPANY, PROCUREMENT_MANAGER, PROCUREMENT_MANAGER_ROLE } from "@/lib/principal";

/**
 * Re-sends a prospect's original invitation email. Shared by the Onboarding
 * workspace and the ticket panel so both send the same reminder.
 *
 * Best-effort, like the first send: the reminder is a nudge, so a mail failure
 * must not look like a hard error. A seeded case may carry no email or token;
 * that is said plainly rather than the action silently doing nothing.
 *
 * Resolves true when the email went out. `quietSuccess` leaves the success toast
 * to the caller (the ticket panel shows its own, with Undo).
 */
export function useInviteReminder() {
  const { t } = useI18n();
  return useCallback(
    async (c: OnboardingCase, opts?: { quietSuccess?: boolean }): Promise<boolean> => {
      if (!c.email || !c.inviteToken) {
        toast({
          title: t("No live invitation to remind about"),
          description: t("Send a new invitation instead."),
          tone: "warning",
        });
        return false;
      }
      try {
        const res = await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: c.email,
            companyName: c.companyName,
            contactName: c.contactName,
            link: `${window.location.origin}/?invite=${c.inviteToken}`,
            principal: PRINCIPAL_COMPANY,
            sender: PROCUREMENT_MANAGER,
            senderRole: PROCUREMENT_MANAGER_ROLE,
          }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "failed");
        if (!opts?.quietSuccess) toast({ title: t("Reminder sent"), description: c.email, tone: "success" });
        return true;
      } catch (e) {
        console.error("[Lynk] reminder email failed:", e);
        toast({ title: t("Could not send the reminder"), description: c.email, tone: "critical" });
        return false;
      }
    },
    [t]
  );
}
