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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {GROUPS.map(({ group, icons }) => (
        <div key={group}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{group}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {icons.map(([name, Icon]) => (
              <div
                key={name}
                className="border border-border rounded-lg bg-card"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px" }}
              >
                <Icon size={20} className="text-foreground" />
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted-foreground)" }}>
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
