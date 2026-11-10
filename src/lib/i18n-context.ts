import { createContext, useContext } from "react";
import type { I18nValue } from "@/lib/i18n";

/* The context and its hook live apart from I18nProvider (a component), so
   fast refresh keeps working when the provider file changes. */
export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
