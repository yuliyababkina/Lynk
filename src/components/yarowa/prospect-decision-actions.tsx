/**
 * @custom   The Procurement Manager's decision on a prospect's application:
 *           Accept, Request changes (with a note for the prospect) and Reject
 *           (kept apart, confirmed, with a reason). The Onboarding drawer and the
 *           ticket panel both decide applications, so the buttons, the note
 *           dialogs and their copy live here once. Composes Button, Separator,
 *           AlertDialog, Label and Textarea.
 * @approved Yuliya Babkina, 2026-11-25
 */
import { useState } from "react";
import { Check, PencilLine, XCircle } from "lucide-react";
import type { ProspectDecision } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n-context";
import { Text } from "@/shared/ui/typography";

export function ProspectDecisionActions({
  companyName,
  canAccept = true,
  onDecide,
}: {
  companyName: string;
  /** False while documents are missing or rejected: the only moves are changes or rejection. */
  canAccept?: boolean;
  onDecide: (decision: ProspectDecision, note?: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [asking, setAsking] = useState<"changes" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(decision: ProspectDecision, withNote?: string) {
    setBusy(true);
    try {
      await onDecide(decision, withNote);
      setAsking(null);
    } finally {
      setBusy(false);
    }
  }

  function ask(kind: "changes" | "reject") {
    setNote("");
    setAsking(kind);
  }

  return (
    <div className="space-y-2">
      {canAccept && (
        <div className="space-y-1.5">
          <Text variant="eyebrow" as="div">{t("Recommended")}</Text>
          <Button className="w-full" disabled={busy} onClick={() => decide("accept")}>
            <Check size={14} />
            {t("Accept application")}
          </Button>
        </div>
      )}
      <Button variant="outline" className="w-full" disabled={busy} onClick={() => ask("changes")}>
        <PencilLine size={14} />
        {t("Request changes")}
      </Button>
      <Separator className="my-3" />
      <Button
        variant="outline"
        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={busy}
        onClick={() => ask("reject")}
      >
        <XCircle size={14} />
        {t("Reject application")}
      </Button>

      <AlertDialog open={asking !== null} onOpenChange={(o) => !o && !busy && setAsking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {asking === "reject"
                ? t("Reject {company}'s application?", { company: companyName })
                : t("Request changes from {company}", { company: companyName })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {asking === "reject"
                ? t("The prospect is told the application was rejected, with your reason. This can't be undone.")
                : t("The prospect sees your note and can resubmit.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="prospect-decision-note" className="block text-xs leading-4 text-muted-foreground">
              {asking === "reject" ? t("Reason for rejection") : t("What does the supplier need to change?")}
            </Label>
            <Textarea
              id="prospect-decision-note"
              autoFocus
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="field-sizing-fixed min-h-0 border-border bg-background p-2 text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("Cancel")}</AlertDialogCancel>
            {/* A plain Button, not AlertDialogAction: the dialog must stay open
                until the decision is saved. */}
            <Button
              variant={asking === "reject" ? "danger" : "default"}
              disabled={busy || !note.trim()}
              onClick={() => asking && decide(asking, note.trim())}
            >
              {asking === "reject" ? t("Reject application") : t("Send feedback")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
