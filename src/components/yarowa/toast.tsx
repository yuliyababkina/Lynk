import { CheckCircle2, AlertTriangle, Info, X, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { dismissToast, useToasts, type ToastTone } from "@/lib/toast";

const TONE_ICON = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
} as const;

const TONE_ICON_COLOR: Record<ToastTone, string> = {
  default: "text-muted-foreground",
  success: "text-success-ink",
  warning: "text-warning-ink",
  critical: "text-critical-ink",
};

export function Toaster() {
  // `t` is the toast in this scope, so the translator takes the pages' alias.
  const { t: tr } = useI18n();
  const items = useToasts();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {items.map((t) => {
        const Icon = TONE_ICON[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${TONE_ICON_COLOR[t.tone]}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{t.title}</div>
              {t.description && (
                <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
              )}
            </div>
            {t.action && (
              <Button
                variant="ghost"
                onClick={() => {
                  t.action!.onClick();
                  dismissToast(t.id);
                }}
                className="h-auto shrink-0 gap-1 border-0 p-0 text-xs font-semibold text-accent hover:bg-transparent hover:text-accent hover:underline dark:hover:bg-transparent"
              >
                <Undo2 size={13} className="size-[13px]" />
                {t.action.label}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => dismissToast(t.id)}
              className="h-auto shrink-0 border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
              aria-label={tr("Dismiss")}
            >
              <X size={15} className="size-[15px]" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
