import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileSearch,
  FileStack,
  Home,
  Inbox,
  LayoutGrid,
  ListChecks,
  ReceiptText,
  Settings,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/*
 * App registry — what the shell's manifest would carry for each micro frontend.
 *
 * In the real shell this lives in manifest.json (remote URL, the paths it owns,
 * who may see it). Here it is a typed list so the prototype can show the three
 * things the shell decides on its own: which apps exist, how they are grouped in
 * the global switcher, and which roles see them. Everything inside an app — its
 * inner menu, its pages, its UI library — belongs to the app.
 *
 * The list is the one Thomas walked through on 28 Oct 2026. Groups follow the
 * ones already in the platform menu today (Operations, Network & Growth,
 * Administration, Account).
 */

export type RoleId = "procurement" | "property" | "admin";

export const ROLES: { id: RoleId; label: string; person: string; initials: string }[] = [
  { id: "procurement", label: "Procurement Manager", person: "Sabine Müller", initials: "SM" },
  { id: "property", label: "Property Manager", person: "Jonas Keller", initials: "JK" },
  { id: "admin", label: "Platform Admin", person: "Lea Brunner", initials: "LB" },
];

export type AppGroup = "Operations" | "Network & Growth" | "Administration" | "Account";
export const APP_GROUPS: AppGroup[] = ["Operations", "Network & Growth", "Administration", "Account"];

export interface InnerNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface WireframeBlock {
  /** What the block stands for — shown as its label. */
  label: string;
  kind: "kpis" | "table" | "list" | "chart" | "form" | "split" | "cards";
}

export interface PlatformApp {
  id: string;
  name: string;
  /** One line under the name in the switcher. */
  description: string;
  icon: LucideIcon;
  group: AppGroup;
  roles: RoleId[];
  /** Which product/team ships the remote today — shown in the shell inspector. */
  remote: string;
  /** "real" renders the actual Lynk prototype; "wireframe" a placeholder. */
  render: "lynk" | "wireframe";
  /** External SaaS front end embedded through the shell. */
  external?: boolean;
  nav: InnerNavItem[];
  /** Wireframe content per inner-nav item id (falls back to the first). */
  wireframe?: Record<string, WireframeBlock[]>;
}

export const APPS: PlatformApp[] = [
  {
    id: "work-orders",
    name: "Work Orders",
    description: "Create, assign and track work orders",
    icon: Wrench,
    group: "Operations",
    roles: ["procurement", "property", "admin"],
    remote: "enable · legacy mount",
    render: "wireframe",
    nav: [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "orders", label: "Work orders", icon: ListChecks },
      { id: "inbox", label: "Inbox", icon: Inbox },
      { id: "providers", label: "Service providers", icon: Users },
    ],
    wireframe: {
      overview: [
        { label: "Open · Overdue · Due this week · Completed", kind: "kpis" },
        { label: "Work orders needing action", kind: "table" },
      ],
      orders: [{ label: "All work orders — filters, status, provider, due date", kind: "table" }],
      inbox: [{ label: "Messages and offers from providers", kind: "split" }],
      providers: [{ label: "Providers on the marketplace", kind: "cards" }],
    },
  },
  {
    id: "tickets",
    name: "Tickets",
    description: "Process tickets and workflows",
    icon: Ticket,
    group: "Operations",
    roles: ["procurement", "property", "admin"],
    remote: "forms · legacy mount",
    render: "wireframe",
    nav: [
      { id: "queue", label: "My queue", icon: Inbox },
      { id: "all", label: "All tickets", icon: Ticket },
      { id: "processes", label: "Processes", icon: FileStack },
    ],
    wireframe: {
      queue: [
        { label: "Assigned to me · Waiting · Escalated", kind: "kpis" },
        { label: "Ticket queue", kind: "list" },
      ],
      all: [{ label: "All tickets", kind: "table" }],
      processes: [{ label: "Process definitions", kind: "cards" }],
    },
  },
  {
    id: "document-requests",
    name: "Document Requests",
    description: "Request and collect documents",
    icon: FileSearch,
    group: "Operations",
    roles: ["procurement", "property", "admin"],
    remote: "document-request · remote",
    render: "wireframe",
    nav: [
      { id: "requests", label: "Requests", icon: FileSearch },
      { id: "templates", label: "Templates", icon: FileStack },
    ],
    wireframe: {
      requests: [{ label: "Open document requests", kind: "table" }],
      templates: [{ label: "Request templates", kind: "cards" }],
    },
  },
  {
    id: "bill-check",
    name: "Bill Check",
    description: "Validate invoices line by line",
    icon: ReceiptText,
    group: "Operations",
    roles: ["property", "admin"],
    remote: "bill-validation · first new MFE",
    render: "wireframe",
    nav: [
      { id: "queue", label: "To validate", icon: ClipboardCheck },
      { id: "done", label: "Validated", icon: ListChecks },
    ],
    wireframe: {
      queue: [{ label: "Invoice preview  |  Line items and AI findings", kind: "split" }],
      done: [{ label: "Validated invoices", kind: "table" }],
    },
  },
  {
    id: "reporting",
    name: "Reporting & Analytics",
    description: "Dashboards across all apps",
    icon: BarChart3,
    group: "Operations",
    roles: ["procurement", "property", "admin"],
    remote: "reporting · remote",
    render: "wireframe",
    nav: [
      { id: "dashboards", label: "Dashboards", icon: BarChart3 },
      { id: "exports", label: "Exports", icon: FileStack },
    ],
    wireframe: {
      dashboards: [
        { label: "Headline figures", kind: "kpis" },
        { label: "Trend", kind: "chart" },
      ],
      exports: [{ label: "Scheduled exports", kind: "table" }],
    },
  },
  {
    id: "lynk",
    name: "Supplier Management",
    description: "Lynk — the full supplier lifecycle",
    icon: ShieldCheck,
    group: "Network & Growth",
    roles: ["procurement", "admin"],
    remote: "lynk · new remote, shadcn",
    render: "lynk",
    nav: [],
  },
  {
    id: "tenant-portal",
    name: "Tenant Portal",
    description: "Partner front end, embedded",
    icon: Home,
    group: "Network & Growth",
    roles: ["property", "admin"],
    remote: "tenant-portal · external SaaS",
    render: "wireframe",
    external: true,
    nav: [
      { id: "requests", label: "Tenant requests", icon: Inbox },
      { id: "units", label: "Units", icon: Building2 },
    ],
    wireframe: {
      requests: [{ label: "Requests from tenants", kind: "list" }],
      units: [{ label: "Units and tenants", kind: "table" }],
    },
  },
  {
    id: "users",
    name: "User Management",
    description: "Users, roles and permissions",
    icon: UserCog,
    group: "Administration",
    roles: ["admin"],
    remote: "one · legacy mount",
    render: "wireframe",
    nav: [
      { id: "users", label: "Users", icon: Users },
      { id: "roles", label: "Roles & permissions", icon: ShieldCheck },
    ],
    wireframe: {
      users: [{ label: "Users", kind: "table" }],
      roles: [{ label: "Role matrix", kind: "table" }],
    },
  },
  {
    id: "account",
    name: "Account Management",
    description: "Company, associates and settings",
    icon: Building2,
    group: "Account",
    roles: ["procurement", "property", "admin"],
    remote: "one · legacy mount",
    render: "wireframe",
    nav: [
      { id: "company", label: "Company", icon: Building2 },
      { id: "associates", label: "Associates", icon: Users },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    wireframe: {
      company: [{ label: "Company profile", kind: "form" }],
      associates: [{ label: "Associates", kind: "table" }],
      settings: [{ label: "Account settings", kind: "form" }],
    },
  },
];

export function appsForRole(role: RoleId): PlatformApp[] {
  return APPS.filter((a) => a.roles.includes(role));
}

export function getApp(id: string): PlatformApp | undefined {
  return APPS.find((a) => a.id === id);
}
