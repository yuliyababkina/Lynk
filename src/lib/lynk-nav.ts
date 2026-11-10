import {
  LayoutGrid,
  Users,
  Shield,
  ShieldCheck,
  FileText,
  BarChart3,
  ClipboardList,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import type { View } from "@/App";

/** The procurement manager's navigation, in menu order. */
export const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "suppliers", label: "Suppliers", icon: Users },
  { id: "data-governance", label: "Data Governance", icon: Shield },
  { id: "onboarding", label: "Onboarding", icon: Rocket },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
  { id: "service-catalogue", label: "Service Catalogue", icon: ClipboardList },
];
