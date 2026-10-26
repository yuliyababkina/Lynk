import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/*
 * Wizard footer. Left: Back. Right: optional "Save as draft" + primary publish.
 * Used at the bottom of each Create/Update Catalogue step.
 *
 * The labels arrive as English source — defaults here, or passed by the step —
 * and are translated on the way to the screen.
 */
export function BottomActionBar({
  onBack,
  onSaveDraft,
  onPrimary,
  backLabel = "Back",
  saveDraftLabel = "Save as draft",
  primaryLabel = "Next",
  showBack = true,
  showSaveDraft = false,
  primaryDisabled = false,
}: {
  onBack?: () => void;
  onSaveDraft?: () => void;
  onPrimary?: () => void;
  backLabel?: string;
  saveDraftLabel?: string;
  primaryLabel?: string;
  showBack?: boolean;
  showSaveDraft?: boolean;
  primaryDisabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      {showBack ? (
        <Button variant="outline" onClick={onBack}>
          {t(backLabel)}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        {showSaveDraft && (
          <Button variant="outline" onClick={onSaveDraft}>
            {t(saveDraftLabel)}
          </Button>
        )}
        <Button onClick={onPrimary} disabled={primaryDisabled}>
          {t(primaryLabel)}
        </Button>
      </div>
    </div>
  );
}
