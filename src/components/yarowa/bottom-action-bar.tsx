import { Button } from "@/components/ui/button";

/*
 * Wizard footer. Left: Back. Right: optional "Save as draft" + primary publish.
 * Used at the bottom of each Create/Update Catalogue step.
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
  return (
    <div className="flex items-center justify-between">
      {showBack ? (
        <Button variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        {showSaveDraft && (
          <Button variant="outline" onClick={onSaveDraft}>
            {saveDraftLabel}
          </Button>
        )}
        <Button onClick={onPrimary} disabled={primaryDisabled}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
