import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAllData,
  setTicketStatusDb,
  setDocStatusDb,
  insertOnboardingCaseDb,
  upsertCatalogueDb,
  logActivity,
  type LynkDataset,
} from "./db";
import { isSupabaseConfigured } from "./supabase";
import type { Ticket, SupplierDoc, Catalogue, OnboardingCase, TicketStatus } from "../types";

interface LynkDataValue extends LynkDataset {
  loading: boolean;
  error: string | null;
  /** True when actions are actually being written to Supabase. */
  persisted: boolean;
  /** Current workflow status per ticket id (live overrides + fetched base). */
  ticketStatusById: Map<string, TicketStatus>;
  /** Move a ticket to any workflow status (To do / In progress / Resolved). */
  setTicketStatus: (ticket: Ticket, status: TicketStatus) => void;
  resolvedTicketIds: Set<string>;
  resolveTicket: (ticket: Ticket, action: string) => void;
  unresolveTicket: (ticketId: string) => void;
  decideRenewal: (doc: SupplierDoc, decision: "accept" | "reject") => void;
  addOnboardingCase: (c: OnboardingCase) => void;
  setCatalogues: (updater: (prev: Catalogue[]) => Catalogue[]) => void;
  persistCatalogue: (c: Catalogue) => void;
}

const LynkDataCtx = createContext<LynkDataValue | null>(null);

export function LynkDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LynkDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketStatusById, setTicketStatusById] = useState<Map<string, TicketStatus>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchAllData()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setTicketStatusById(
          new Map(
            d.tickets.map((t) => [t.id, t.status ?? (t.resolved ? "Resolved" : "To do")])
          )
        );
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTicketStatus = useCallback((ticket: Ticket, status: TicketStatus) => {
    setTicketStatusById((prev) => new Map(prev).set(ticket.id, status));
    setTicketStatusDb(ticket.id, status).catch(console.error);
  }, []);

  const resolveTicket = useCallback((ticket: Ticket, action: string) => {
    setTicketStatusById((prev) => new Map(prev).set(ticket.id, "Resolved"));
    setTicketStatusDb(ticket.id, "Resolved").catch(console.error);
    logActivity(ticket.entityName, `${action} — ${ticket.title}`).catch(console.error);
  }, []);

  const unresolveTicket = useCallback((ticketId: string) => {
    setTicketStatusById((prev) => new Map(prev).set(ticketId, "To do"));
    setTicketStatusDb(ticketId, "To do").catch(console.error);
  }, []);

  const resolvedTicketIds = useMemo(
    () =>
      new Set(
        [...ticketStatusById].filter(([, s]) => s === "Resolved").map(([id]) => id)
      ),
    [ticketStatusById]
  );

  const decideRenewal = useCallback((doc: SupplierDoc, decision: "accept" | "reject") => {
    const nextStatus = decision === "accept" ? "valid" : "rejected-resubmit";
    setData((prev) =>
      prev
        ? {
            ...prev,
            docs: prev.docs.map((d) =>
              d.id === doc.id ? { ...d, status: nextStatus, renewal: undefined } : d
            ),
          }
        : prev
    );
    setDocStatusDb(doc.id, nextStatus).catch(console.error);
    logActivity(doc.supplierName, `Renewal ${decision}ed — ${doc.documentName}`).catch(console.error);
  }, []);

  const addOnboardingCase = useCallback((c: OnboardingCase) => {
    setData((prev) =>
      prev ? { ...prev, onboardingCases: [c, ...prev.onboardingCases] } : prev
    );
    insertOnboardingCaseDb(c).catch(console.error);
    logActivity(c.companyName, "Invitation sent").catch(console.error);
  }, []);

  const setCatalogues = useCallback((updater: (prev: Catalogue[]) => Catalogue[]) => {
    setData((prev) => (prev ? { ...prev, catalogues: updater(prev.catalogues) } : prev));
  }, []);

  const persistCatalogue = useCallback((c: Catalogue) => {
    upsertCatalogueDb(c).catch(console.error);
  }, []);

  const value = useMemo<LynkDataValue | null>(() => {
    if (!data) return null;
    return {
      ...data,
      loading,
      error,
      persisted: isSupabaseConfigured,
      ticketStatusById,
      setTicketStatus,
      resolvedTicketIds,
      resolveTicket,
      unresolveTicket,
      decideRenewal,
      addOnboardingCase,
      setCatalogues,
      persistCatalogue,
    };
  }, [
    data,
    loading,
    error,
    ticketStatusById,
    setTicketStatus,
    resolvedTicketIds,
    resolveTicket,
    unresolveTicket,
    decideRenewal,
    addOnboardingCase,
    setCatalogues,
    persistCatalogue,
  ]);

  if (!value) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        {error ? (
          <div className="text-center max-w-sm">
            <div className="font-semibold mb-1">Couldn't load Lynk data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Loading Lynk…</div>
        )}
      </div>
    );
  }

  return <LynkDataCtx.Provider value={value}>{children}</LynkDataCtx.Provider>;
}

export function useLynkData(): LynkDataValue {
  const ctx = useContext(LynkDataCtx);
  if (!ctx) throw new Error("useLynkData must be used within LynkDataProvider");
  return ctx;
}
