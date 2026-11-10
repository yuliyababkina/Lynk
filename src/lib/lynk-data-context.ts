import { createContext, useContext } from "react";
import type { LynkDataValue } from "@/lib/LynkDataContext";

/* The context and its hook live apart from LynkDataProvider (a component), so
   fast refresh keeps working when the provider file changes. */
export const LynkDataCtx = createContext<LynkDataValue | null>(null);

export function useLynkData(): LynkDataValue {
  const ctx = useContext(LynkDataCtx);
  if (!ctx) throw new Error("useLynkData must be used within LynkDataProvider");
  return ctx;
}
