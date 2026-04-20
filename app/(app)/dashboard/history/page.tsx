"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ImpactBadge } from "@/components/carbon/impact-badge";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  carbonKg: number;
  impactLevel: "low" | "medium" | "high";
  suggestedSwap?: string;
  swapSavingsKg?: number;
}

interface Receipt {
  id: string;
  storeName?: string;
  receiptDate?: string;
  items: ReceiptItem[];
  totalCarbonKg: number;
  totalItems: number;
  insights?: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReceipts = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/v1/receipts?page=${p}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.receipts);
        setTotalPages(data.pagination.pages);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts(page);
  }, [page, fetchReceipts]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
        <p className="mt-1 text-muted-foreground">
          View all your past receipt scans and their carbon footprints
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
          <p className="text-lg font-medium">No scans yet</p>
          <p className="mt-1 text-muted-foreground">
            <Link
              href="/dashboard/scan"
              className="text-primary hover:underline"
            >
              Scan your first receipt
            </Link>{" "}
            to start tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt, index) => {
            const isExpanded = expandedId === receipt.id;
            const highCount = receipt.items.filter(
              (i) => i.impactLevel === "high"
            ).length;
            const medCount = receipt.items.filter(
              (i) => i.impactLevel === "medium"
            ).length;

            return (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border bg-card"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : receipt.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {receipt.storeName || "Receipt"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.totalItems} items •{" "}
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden gap-1.5 sm:flex">
                      {highCount > 0 && <ImpactBadge level="high" />}
                      {medCount > 0 && <ImpactBadge level="medium" />}
                    </div>
                    <span className="text-lg font-bold">
                      {receipt.totalCarbonKg.toFixed(1)} kg
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t"
                  >
                    <div className="divide-y">
                      {receipt.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-6 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.name}
                            </span>
                            <ImpactBadge level={item.impactLevel} />
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold">
                              {item.carbonKg.toFixed(1)} kg CO₂
                            </span>
                            {item.suggestedSwap && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                → {item.suggestedSwap}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {receipt.insights && (
                      <div className="border-t bg-muted/30 px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                          💡 {receipt.insights}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
