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
  resolveTicketDb,
  setDocStatusDb,
  insertOnboardingCaseDb,
  upsertCatalogueDb,
  logActivity,
  type LynkDataset,
} from "./db";
import { isSupabaseConfigured } from "./supabase";
import type { Ticket, SupplierDoc, Catalogue, OnboardingCase } from "../types";

interface LynkDataValue extends LynkDataset {
  loading: boolean;
  error: string | null;
  /** True when actions are actually being written to Supabase. */
  persisted: boolean;
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
  const [resolvedTicketIds, setResolvedTicketIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetchAllData()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setResolvedTicketIds(
          new Set(d.tickets.filter((t) => t.resolved).map((t) => t.id))
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

  const resolveTicket = useCallback((ticket: Ticket, action: string) => {
    setResolvedTicketIds((prev) => new Set(prev).add(ticket.id));
    resolveTicketDb(ticket.id, true).catch(console.error);
    logActivity(ticket.entityName, `${action} — ${ticket.title}`).catch(console.error);
  }, []);

  const unresolveTicket = useCallback((ticketId: string) => {
    setResolvedTicketIds((prev) => {
      const next = new Set(prev);
      next.delete(ticketId);
      return next;
    });
    resolveTicketDb(ticketId, false).catch(console.error);
  }, []);

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
