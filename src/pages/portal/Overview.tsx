import {
  ArrowRight,
  Shield,
  FileText,
  PencilLine,
  Upload,
  Send,
  CircleCheck,
  CircleAlert,
  Clock,
  Hourglass,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskGroupCard, TaskRow } from "@/components/yarowa/task-group-card";
import type { PortalView } from "@/pages/SupplierPortal";
import type { PortalActivitySelection } from "@/components/yarowa/portal-activity-drawer";
import {
  getPortalProfile,
  type ActivityItem,
  type OverviewGroup,
  type PortalStat,
  type PrincipalChip,
  type Tone,
} from "./portal-data";

export interface PortalOverviewProps {
  supplierId: string;
  onNavigate?: (view: PortalView) => void;
  onOpenActivity?: (selection: PortalActivitySelection) => void;
}

// Supplier-portal section iconography — its own set, distinct from the PM
// dashboard's criticality icons. Colour follows the group's tone.
const SECTION_ICON: Record<string, typeof CircleCheck> = {
  "action-required": CircleAlert,
  "expiring-soon": Clock,
  "pending-approval": Hourglass,
  resolved: CircleCheck,
};

const ICON_INK: Record<Tone, string> = {
  critical: "text-critical",
  orange: "text-chart-orange",
  medium: "text-medium",
  success: "text-success",
  warning: "text-warning",
  neutral: "text-muted-foreground",
};

const ACTION_ICON: Record<string, typeof PencilLine> = {
  Update: PencilLine,
  Complete: PencilLine,
  Upload: Upload,
  Chat: Send,
  Remind: Send,
  Review: CircleCheck,
};

function actionVariant(label: string): "dark" | "secondary" | "outline" {
  if (label === "Update" || label === "Upload" || label === "Complete") return "dark";
  if (label === "Chat") return "secondary";
  return "outline";
}

function ActionButton({ label }: { label: string }) {
  const Icon = ACTION_ICON[label];
  return (
    <Button variant={actionVariant(label)} size="xs">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </Button>
  );
}

function GroupCard({
  group,
  onOpenActivity,
}: {
  group: OverviewGroup;
  onOpenActivity?: (selection: PortalActivitySelection) => void;
}) {
  const SectionIcon = SECTION_ICON[group.key] ?? CircleAlert;
  return (
    <TaskGroupCard
      icon={<SectionIcon className={cn("w-[17px] h-[17px]", ICON_INK[group.tone])} />}
      label={group.label}
      count={group.count}
    >
      {group.items.length > 0 ? (
        group.items.map((item: ActivityItem) => {
          const Icon = item.icon === "shield" ? Shield : FileText;
          return (
            <TaskRow
              key={item.id}
              onClick={() => onOpenActivity?.({ item, sectionLabel: group.label, tone: group.tone })}
              icon={<Icon className={cn("w-4 h-4", ICON_INK[group.tone])} />}
              title={
                <>
                  {item.title} <span className="font-normal text-muted-foreground">— {item.detail}</span>
                </>
              }
              subline={
                <>
                  {item.principal} · {item.ageLabel}
                </>
              }
              action={
                <div className="flex items-center gap-1.5">
                  {item.actions.map((a) => (
                    <ActionButton key={a} label={a} />
                  ))}
                </div>
              }
            />
          );
        })
      ) : (
        <p className="py-6 px-4 text-sm text-muted-foreground text-center">Nothing here right now.</p>
      )}
    </TaskGroupCard>
  );
}

const CHIP_ICON: Record<PrincipalChip["tone"], { Icon: typeof CircleCheck; ink: string } | null> = {
  warning: { Icon: TriangleAlert, ink: "text-warning" },
  success: { Icon: CircleCheck, ink: "text-success" },
  neutral: null,
};

function StatTile({ stat, onNavigate }: { stat: PortalStat; onNavigate?: (view: PortalView) => void }) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onNavigate?.(stat.key as PortalView)}
      className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:0px] p-5 gap-0 cursor-pointer hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold mt-2">{stat.value}</p>
      {stat.principals ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          {stat.principals.map((p) => {
            const meta = CHIP_ICON[p.tone];
            return (
              <span key={p.name} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {meta && <meta.Icon className={cn("w-3.5 h-3.5", meta.ink)} />}
                {p.name}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">{stat.hint}</p>
      )}
    </Card>
  );
}

const QUICK_ACTIONS = [
  { icon: Upload, title: "Upload Document", hint: "Renew expiring documents" },
  { icon: PencilLine, title: "Request Data Change", hint: "IBAN, address updates" },
];

export function PortalOverview({ supplierId, onNavigate, onOpenActivity }: PortalOverviewProps) {
  const profile = getPortalProfile(supplierId);

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Good morning, {profile.firstName}</h1>
        <p className="text-muted-foreground mt-1">
          Here's the current status of your supplier account with Lynk.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profile.stats.map((stat) => (
          <StatTile key={stat.key} stat={stat} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {profile.overviewGroups.map((group) => (
          <GroupCard key={group.key} group={group} onOpenActivity={onOpenActivity} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ACTIONS.map(({ icon: Icon, title, hint }) => (
          <Card
            key={title}
            role="button"
            tabIndex={0}
            className="rounded-2xl border border-border ring-0 shadow-none [--card-spacing:0px] p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-soft text-success-ink flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{hint}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
