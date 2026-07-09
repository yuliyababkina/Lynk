import { useSyncExternalStore } from "react";
import { CheckCircle2, AlertTriangle, Info, X, Undo2 } from "lucide-react";

/*
 * Lightweight, dependency-free toast system.
 *
 * A module-level store lets `toast(...)` be called from anywhere (pages,
 * drawers, event handlers) without threading a context through props.
 * Mount a single <Toaster /> near the app root to render them.
 */

export type ToastTone = "default" | "success" | "warning" | "critical";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: ToastAction;
  duration: number;
}

type Listener = () => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  // New array identity so useSyncExternalStore detects the change.
  toasts = [...toasts];
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function dismissToast(id: number) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(input: {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: ToastAction;
  duration?: number;
}) {
  const id = nextId++;
  const duration = input.duration ?? 4500;
  const t: Toast = {
    id,
    title: input.title,
    description: input.description,
    tone: input.tone ?? "default",
    action: input.action,
    duration,
  };
  toasts = [...toasts, t];
  emit();
  timers.set(
    id,
    setTimeout(() => dismissToast(id), duration)
  );
  return id;
}

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
  const items = useSyncExternalStore(subscribe, () => toasts, () => toasts);

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
              <button
                onClick={() => {
                  t.action!.onClick();
                  dismissToast(t.id);
                }}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Undo2 size={13} />
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
