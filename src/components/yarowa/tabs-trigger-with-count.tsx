import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { TabsTrigger } from "@/components/ui/tabs";

/**
 * @custom   Onboarding and Suppliers Overview both render a TabsTrigger with a
 *           count Badge after the label. shadcn Tabs has no count slot, and the
 *           markup now repeats on two screens, so it lives here once. It is a
 *           pure composition of TabsTrigger + Badge (variant="count"): all
 *           styling stays in ui/tabs.tsx and ui/badge.tsx.
 * @approved Yuliya Babkina, 2026-11-12
 */
export function TabsTriggerWithCount({
  count,
  children,
  ...props
}: ComponentProps<typeof TabsTrigger> & { count: number }) {
  return (
    <TabsTrigger {...props}>
      {children}
      <Badge variant="count">{count}</Badge>
    </TabsTrigger>
  );
}
