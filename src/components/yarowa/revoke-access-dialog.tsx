/**
 * @custom   Confirmation before revoking a supplier's access over a document.
 *           The Compliance drawer and the ticket panel both offer Revoke, and a
 *           destructive action must ask the same question in both, so the
 *           AlertDialog composition and its copy live here once. Composes
 *           AlertDialog.
 * @approved Yuliya Babkina, 2026-11-25
 */
import { Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n-context";

export function RevokeAccessDialog({
  open,
  onOpenChange,
  supplierName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Revoke {supplier}'s access?", { supplier: supplierName })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("They can't be assigned new work orders until the document is renewed and accepted.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirm}>
            <Ban size={14} />
            {t("Revoke supplier access")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
