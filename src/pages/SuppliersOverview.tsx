import { useMemo, useState } from "react";
import { Search, Plus, Star, MessageSquare } from "lucide-react";
import { useLynkData } from "../lib/lynk-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { TabsTriggerWithCount } from "@/components/yarowa/tabs-trigger-with-count";
import { useI18n } from "@/lib/i18n-context";
import { relationshipId } from "@/lib/db";
import { PRINCIPAL_ID } from "@/data";
import type { Supplier } from "../types";

type StageFilter = "all" | "prospect" | "supplier" | "provider";

const stageLabels: Record<StageFilter, string> = {
  all: "All",
  prospect: "Prospect",
  supplier: "Supplier",
  provider: "Provider",
};

const complianceTone: Record<string, "success" | "warning" | "danger" | "neutral" | "purple"> = {
  "Fully Compliant": "success",
  "Pending Review": "warning",
  Blocked: "purple",
  "Action Required": "danger",
  "—": "neutral",
};

function formatStageLabel(stage: Supplier["stage"]) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function SuppliersOverview({
  onOpenProfile,
  initialSelectedId,
}: {
  onOpenProfile: (id: string) => void;
  initialSelectedId?: string | null;
}) {
  const { suppliers: SUPPLIERS, unreadFor } = useLynkData();
  const { t } = useI18n();
  const [stage, setStage] = useState<StageFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return SUPPLIERS.filter((s) => {
      // The DB stores capitalised stage values ("Prospect"), so compare
      // case-insensitively — a strict === here left every filter count at 0.
      if (stage !== "all" && s.stage.toLowerCase() !== stage) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [stage, query, SUPPLIERS]);

  const counts: Record<StageFilter, number> = {
    all: SUPPLIERS.length,
    prospect: SUPPLIERS.filter((s) => s.stage.toLowerCase() === "prospect").length,
    supplier: SUPPLIERS.filter((s) => s.stage.toLowerCase() === "supplier").length,
    provider: SUPPLIERS.filter((s) => s.stage.toLowerCase() === "provider").length,
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("Suppliers Overview")}</h1>
          <p className="text-sm text-muted-foreground">{t("All contacts — Prospects, Suppliers, and Providers.")}</p>
        </div>
        <Button>
          <Plus size={14} /> {t("Invite Supplier")}
        </Button>
      </div>

      <Tabs value={stage} onValueChange={(v) => setStage(v as StageFilter)} className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="min-w-0">
            {(["all", "prospect", "supplier", "provider"] as const).map((s) => (
              <TabsTriggerWithCount key={s} value={s} count={counts[s]}>
                {t(stageLabels[s])}
              </TabsTriggerWithCount>
            ))}
          </TabsList>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search...")}
              className="h-auto w-56 rounded-md border-border bg-background py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
        </div>
        <TabsContent value={stage}>
          {/* Scrolls inside its own box rather than pushing the page sideways, so
              the table stays usable when the chat dock takes 380px off the width. */}
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="text-xs border-border hover:bg-transparent">
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("COMPANY")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("STAGE")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("TRADE")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("REGION")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("TICKETS")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("COMPLIANCE")}</TableHead>
                  <TableHead className="h-auto px-4 py-2 whitespace-normal text-muted-foreground">{t("RATING")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: Supplier) => (
                  <TableRow
                    key={s.id}
                    onClick={() => onOpenProfile(s.id)}
                    className={`border-border cursor-pointer hover:bg-secondary/50 ${
                      initialSelectedId === s.id ? "bg-secondary/50" : ""
                    }`}
                  >
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{s.name}</span>
                        {/* Unread messages from this supplier, so the PM can see
                            who is waiting on a reply without opening each profile. */}
                        {unreadFor(relationshipId(PRINCIPAL_ID, s.id), "principal") > 0 && (
                          <Badge variant="critical" title={t("Messages")}>
                            <MessageSquare className="w-3 h-3" />
                            {unreadFor(relationshipId(PRINCIPAL_ID, s.id), "principal")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.contacts[0]?.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      <Badge variant="neutral">{t(formatStageLabel(s.stage))}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{t(s.trade)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{t(s.region)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      {s.openTickets > 0 ? (
                        <Badge variant="warning">
                          {s.openTickets > 1
                            ? t("{count} tickets", { count: s.openTickets })
                            : t("{count} ticket", { count: s.openTickets })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      {s.compliance === "—" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge variant={complianceTone[s.compliance]}>{t(s.compliance)}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      {s.rating ? (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Star size={12} className="fill-warning text-warning" />
                          {s.rating}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Showing {filtered.length} of {SUPPLIERS.length} contacts
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
