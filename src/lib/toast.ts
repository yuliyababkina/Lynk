import { useSyncExternalStore } from "react";

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

/** The current toasts, re-rendering the caller when they change. */
export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, () => toasts, () => toasts);
}
