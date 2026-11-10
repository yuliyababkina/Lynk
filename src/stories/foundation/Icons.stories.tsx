import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  // actions
  Eye, AlertTriangle, RefreshCw, Bell, Check, Send, Upload, Download, Edit, Plus, Search, MoreHorizontal,
  // status
  CircleAlert, TriangleAlert, Info, CircleCheck, CheckCircle2, Loader2, Lock, Shield, ShieldCheck, Star,
  // navigation
  ArrowLeft, ArrowUpRight, ChevronDown, ChevronUp, X,
  // entities / sections
  Users, Building2, FileText, FileSpreadsheet, ClipboardList, LayoutGrid, BarChart3, Mail, Rocket,
  type LucideIcon,
} from "lucide-react";

/*
 * The Lynk icon set — all from lucide-react (24px stroke). Grouped by how the
 * product uses them. Action icons map to ticket actions on the Dashboard
 * (Review→Eye, Escalate→AlertTriangle, Renew→RefreshCw, Remind→Bell,
 * Approve→Check, Request→Send).
 */
const GROUPS: { group: string; icons: [string, LucideIcon][] }[] = [
  {
    group: "Actions",
    icons: [
      ["Eye", Eye], ["AlertTriangle", AlertTriangle], ["RefreshCw", RefreshCw], ["Bell", Bell],
      ["Check", Check], ["Send", Send], ["Upload", Upload], ["Download", Download],
      ["Edit", Edit], ["Plus", Plus], ["Search", Search], ["MoreHorizontal", MoreHorizontal],
    ],
  },
  {
    group: "Status",
    icons: [
      ["CircleAlert", CircleAlert], ["TriangleAlert", TriangleAlert], ["Info", Info],
      ["CircleCheck", CircleCheck], ["CheckCircle2", CheckCircle2], ["Loader2", Loader2],
      ["Lock", Lock], ["Shield", Shield], ["ShieldCheck", ShieldCheck], ["Star", Star],
    ],
  },
  {
    group: "Navigation",
    icons: [
      ["ArrowLeft", ArrowLeft], ["ArrowUpRight", ArrowUpRight], ["ChevronDown", ChevronDown],
      ["ChevronUp", ChevronUp], ["X", X],
    ],
  },
  {
    group: "Entities & sections",
    icons: [
      ["Users", Users], ["Building2", Building2], ["FileText", FileText],
      ["FileSpreadsheet", FileSpreadsheet], ["ClipboardList", ClipboardList], ["LayoutGrid", LayoutGrid],
      ["BarChart3", BarChart3], ["Mail", Mail], ["Rocket", Rocket],
    ],
  },
];

function IconGallery() {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map(({ group, icons }) => (
        <div key={group}>
          <div className="mb-2.5 text-[13px] font-semibold">{group}</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
            {icons.map(([name, Icon]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-4"
              >
                <Icon size={20} className="text-foreground" />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Foundation/Icons",
  component: IconGallery,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
