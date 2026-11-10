import { createContext, useContext } from "react";

/** Whether the shell inspector (region outlines + owner tags) is switched on. */
export const InspectorContext = createContext(false);

export function useInspector() {
  return useContext(InspectorContext);
}
