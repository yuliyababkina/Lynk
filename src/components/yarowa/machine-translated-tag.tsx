import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Marker shown on machine-translated free-form content. The spec calls for this
 * on anything that might matter legally (compliance/contract wording), so a PM
 * knows they're reading a translation, not the author's actual words — the same
 * pattern browsers / Google Translate use.
 */
export function MachineTranslatedTag({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
        className
      )}
      title={t("Machine translated — not the author's original wording.")}
    >
      <Languages className="w-3 h-3" />
      {t("Machine translated")}
    </span>
  );
}
