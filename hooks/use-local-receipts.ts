"use client";

import { useCallback } from "react";
import { usePersistedState } from "@/hooks/aevr/use-persisted-state";

export interface LocalReceipt {
  localId: string;
  storeName?: string;
  receiptDate?: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    carbonKg: number;
    impactLevel: "low" | "medium" | "high";
    suggestedSwap?: string;
    swapSavingsKg?: number;
  }[];
  totalCarbonKg: number;
  totalItems: number;
  insights?: string;
  createdAt: string;
  synced: boolean;
}

const STORAGE_KEY = "carbon-lens-local-receipts";

export function useLocalReceipts() {
  const {
    state: receipts,
    setState: setReceipts,
    isHydrated,
  } = usePersistedState<LocalReceipt[]>([], { storageKey: STORAGE_KEY });

  const addReceipt = useCallback(
    (data: Omit<LocalReceipt, "localId" | "synced">) => {
      const entry: LocalReceipt = {
        ...data,
        localId: crypto.randomUUID(),
        synced: false,
      };
      setReceipts((prev) => [entry, ...(prev ?? [])]);
      return entry;
    },
    [setReceipts]
  );

  const markSynced = useCallback(
    (localIds: string[]) => {
      const idSet = new Set(localIds);
      setReceipts((prev) =>
        (prev ?? []).map((r) =>
          idSet.has(r.localId) ? { ...r, synced: true } : r
        )
      );
    },
    [setReceipts]
  );

  const clearSynced = useCallback(() => {
    setReceipts((prev) => (prev ?? []).filter((r) => !r.synced));
  }, [setReceipts]);

  const unsyncedReceipts = (receipts ?? []).filter((r) => !r.synced);

  const localStats = (receipts ?? []).reduce(
    (acc, r) => ({
      totalScans: acc.totalScans + 1,
      totalCarbonKg: acc.totalCarbonKg + r.totalCarbonKg,
      totalItems: acc.totalItems + r.totalItems,
    }),
    { totalScans: 0, totalCarbonKg: 0, totalItems: 0 }
  );

  return {
    receipts: receipts ?? [],
    unsyncedReceipts,
    localStats,
    addReceipt,
    markSynced,
    clearSynced,
    isHydrated,
  };
}
