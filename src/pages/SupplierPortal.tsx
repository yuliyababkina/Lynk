import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalSidebar } from "@/components/yarowa/portal-sidebar";
import { Toaster } from "@/components/yarowa/toast";
import { TopHeader } from "@/components/yarowa/top-header";
import { PortalOverview } from "./portal/Overview";
import { PortalPrincipals } from "./portal/Principals";
import { PortalDocuments } from "./portal/Documents";
import { PortalRequestedUpdates } from "./portal/RequestedUpdates";
import { PortalCompanyDetails } from "./portal/CompanyDetails";
import { PortalPriceAgreements } from "./portal/PriceAgreements";
import { PortalOnboarding } from "./portal/Onboarding";
import {
  PortalActivityDrawer,
  type ActivityOutcome,
  type ChangeRecord,
  type PortalActivitySelection,
} from "@/components/yarowa/portal-activity-drawer";
import { ChatDock, useChatDock } from "@/components/yarowa/chat-dock";
import { NotificationBell } from "@/components/yarowa/notification-bell";
import { useLynkData } from "@/lib/LynkDataContext";
import { relationshipId } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { PRINCIPAL_ID, SUPPLIER_RELATIONSHIPS_MARTIN, SUPPLIER_RELATIONSHIPS_MEHMET } from "@/data";
import { PRINCIPAL_SHORT } from "@/lib/principal";
import type { ChatContext } from "@/types";
import { getPortalProfile, type CompanyDetails, type OverviewGroup } from "./portal/portal-data";

export type PortalView =
  | "overview"
  | "principals"
  | "documents"
  | "requested-updates"
  | "price-agreements"
  | "company-details"
  | "onboarding";

export interface PortalProps {
  supplierName: string;
  supplierId: string;
  onSwitchAccount?: () => void;
}

const VIEW_LABEL: Record<PortalView, string> = {
  overview: "Overview",
  principals: "Principals",
  documents: "Documents",
  "requested-updates": "Requested Updates",
  "price-agreements": "Price Agreements",
  "company-details": "Company Details",
  onboarding: "Onboarding",
};

export function SupplierPortal({ supplierName, supplierId, onSwitchAccount }: PortalProps) {
  const [view, setView] = useState<PortalView>("overview");
  const [activity, setActivity] = useState<PortalActivitySelection | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /* The portal's single open conversation. `draft`/`draftContext` carry an item
     through from a Chat button, so the supplier doesn't have to re-describe
     what it is about. */
  const chat = useChatDock();

  /* Tickets and profile edits live here for the length of the session, the same
     way the rest of the portal holds its state — so fixing something from the
     Overview panel is visible straight away, without a round trip. Switching
     persona starts from that persona's own data again. */
  const [groups, setGroups] = useState<OverviewGroup[]>(() => getPortalProfile(supplierId).overviewGroups);
  const [company, setCompany] = useState<CompanyDetails>(() => getPortalProfile(supplierId).company);
  /* What was sent for endorsement, kept so a Pending Approval item can show the
     before/after instead of only saying that something is being reviewed. */
  const [changeRequests, setChangeRequests] = useState<Record<string, ChangeRecord[]>>({});

  useEffect(() => {
    const profile = getPortalProfile(supplierId);
    setGroups(profile.overviewGroups);
    setCompany(profile.company);
    setChangeRequests({});
    setActivity(null);
  }, [supplierId]);

  /* Moves a finished ticket out of its group and into the one that now describes
     it — Pending Approval while someone else reviews it, Resolved when the
     supplier's own action was the last word. */
  const itemDone = useCallback((itemId: string, outcome: ActivityOutcome, changes?: ChangeRecord[]) => {
    if (changes?.length) setChangeRequests((prev) => ({ ...prev, [itemId]: changes }));
    setGroups((prev) => {
      const found = prev.flatMap((g) => g.items).find((i) => i.id === itemId);
      if (!found) return prev;
      /* The actions travel with the state. Once something is with the principal
         there is nothing left to upload — offering it again would invite the
         supplier to submit the same file twice. */
      const moved = {
        ...found,
        actions: outcome === "pending-approval" ? ["Remind"] : ["Review"],
      };
      return prev.map((g) => {
        const without = g.items.filter((i) => i.id !== itemId);
        if (g.key === outcome) {
          const items = [moved, ...without];
          return { ...g, items, count: items.length };
        }
        return { ...g, items: without, count: without.length };
      });
    });
  }, []);

  const { t } = useI18n();
  const { messagesFor, unreadRelationships } = useLynkData();
  /** Who this persona is, for the "Company | Person · role" line on each message. */
  const profile = getPortalProfile(supplierId);

  /* Every principal this account deals with. The Chat buttons on tickets are
     about the Principal that runs this tenant, so they open that conversation;
     the Principals page can open any of them. */
  const ownRelationship = relationshipId(PRINCIPAL_ID, supplierId);

  /* The conversations this account may see — and the only ones the bell is ever
     given. One supplier account, several principals, one thread each. */
  const myRelationships = useMemo(
    () =>
      (supplierId === "supplier_mehmet_yilmaz"
        ? SUPPLIER_RELATIONSHIPS_MEHMET
        : SUPPLIER_RELATIONSHIPS_MARTIN
      ).map((r) => ({
        conversation: relationshipId(r.principalId, supplierId),
        principalName: r.principalName,
      })),
    [supplierId]
  );

  const bellEntries = useMemo(
    () =>
      unreadRelationships(
        "supplier",
        myRelationships.map((r) => r.conversation)
      ).map(({ relationship, count }) => ({
        relationship,
        title: myRelationships.find((r) => r.conversation === relationship)?.principalName ?? "",
        count,
        latest: messagesFor(relationship).slice(-1)[0],
      })),
    [myRelationships, unreadRelationships, messagesFor]
  );

  // Switching views closes any open detail drawer.
  const navigate = (v: PortalView) => {
    setActivity(null);
    setView(v);
  };

  const openChat = (
    relationship: string,
    principalName: string,
    draft?: string,
    draftContext?: ChatContext
  ) => {
    /* One rail at a time: the ticket drawer and the chat are both 380px, and
       side by side they leave the portal itself unreadable below 1600px. The
       ticket travels into the composer as a link, so nothing is lost. */
    setActivity(null);
    chat.open({
      relationship,
      side: "supplier",
      author: {
        side: "supplier",
        name: profile.fullName,
        company: company.legalName,
        role: profile.role,
      },
      title: principalName,
      subtitle: t("Your conversation with {company}", { company: principalName }),
      draft,
      draftContext,
      onOpenContext: (context) => {
        // Navigation only — chat never acts on the thing it links to.
        if (context.type === "document") navigate("documents");
        else if (context.type === "data-change") navigate("requested-updates");
        else navigate("onboarding");
      },
    });
  };

  const supplierInitials = supplierName
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <PortalSidebar
        view={view}
        onNavigate={navigate}
        supplierId={supplierId}
        collapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen((open) => !open)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-sidebar">
        <TopHeader
          currentLabel={VIEW_LABEL[view]}
          onSwitchAccount={onSwitchAccount}
          accountInitials={supplierInitials || "SP"}
          trailing={
            <NotificationBell
              entries={bellEntries}
              onOpen={(relationship) => {
                const match = myRelationships.find((r) => r.conversation === relationship);
                openChat(relationship, match?.principalName ?? PRINCIPAL_SHORT);
              }}
            />
          }
        />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto min-w-0 bg-sidebar">
            {view === "overview" && (
              <PortalOverview
                supplierId={supplierId}
                groups={groups}
                onNavigate={navigate}
                onOpenActivity={(selection) => {
                  // One rail at a time, in both directions — see openChat.
                  chat.close();
                  setActivity(selection);
                }}
                onOpenChat={(draft, context) =>
                  openChat(ownRelationship, PRINCIPAL_SHORT, draft, context)
                }
              />
            )}
            {view === "principals" && (
              <PortalPrincipals supplierId={supplierId} onOpenChat={openChat} />
            )}
            {view === "documents" && <PortalDocuments supplierId={supplierId} />}
            {view === "requested-updates" && <PortalRequestedUpdates supplierId={supplierId} />}
            {view === "price-agreements" && <PortalPriceAgreements supplierId={supplierId} />}
            {view === "company-details" && (
              <PortalCompanyDetails supplierId={supplierId} company={company} />
            )}
            {view === "onboarding" && <PortalOnboarding supplierId={supplierId} />}
          </main>
          {activity && (
            <PortalActivityDrawer
              /* Remount per ticket: the panel holds a picked file and edited
                 field values, and neither should survive opening another one. */
              key={activity.item?.id ?? activity.quick ?? "panel"}
              selection={activity}
              supplierId={supplierId}
              supplierName={company.legalName}
              company={company}
              onClose={() => setActivity(null)}
              onCompanyChange={setCompany}
              onItemDone={itemDone}
              changeRequests={changeRequests}
              onOpenChat={(draft, draftContext) =>
                openChat(ownRelationship, PRINCIPAL_SHORT, draft, draftContext)
              }
            />
          )}

          <ChatDock conversation={chat.conversation} onClose={chat.close} />
        </div>
      </div>

      {/* The portal is rendered instead of the PM shell, not inside it, so it
          needs its own toast surface — otherwise confirmations go nowhere. */}
      <Toaster />
    </div>
  );
}
