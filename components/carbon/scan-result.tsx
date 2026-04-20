"use client";

import { motion } from "motion/react";
import { ImpactBadge } from "./impact-badge";
import { ArrowRight, Leaf } from "lucide-react";

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

interface ScanResultProps {
  storeName?: string;
  receiptDate?: string;
  items: ReceiptItem[];
  totalCarbonKg: number;
  totalItems: number;
  insights?: string;
}

export function ScanResult({
  storeName,
  receiptDate,
  items,
  totalCarbonKg,
  totalItems,
  insights,
}: ScanResultProps) {
  const highImpactCount = items.filter((i) => i.impactLevel === "high").length;
  const totalSwapSavings = items.reduce(
    (sum, i) => sum + (i.swapSavingsKg || 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Summary header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {storeName && (
              <p className="text-sm text-muted-foreground">{storeName}</p>
            )}
            <h3 className="text-2xl font-bold">
              {totalCarbonKg.toFixed(1)} kg CO₂e
            </h3>
            <p className="text-sm text-muted-foreground">
              from {totalItems} items
              {receiptDate &&
                ` • ${new Date(receiptDate).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            {highImpactCount > 0 && (
              <span className="rounded-lg bg-red-100 px-3 py-1.5 font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {highImpactCount} high-impact{" "}
                {highImpactCount === 1 ? "item" : "items"}
              </span>
            )}
            {totalSwapSavings > 0 && (
              <span className="rounded-lg bg-emerald-100 px-3 py-1.5 font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                Save up to {totalSwapSavings.toFixed(1)} kg with swaps
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <h4 className="font-semibold">Items Breakdown</h4>
        </div>
        <div className="divide-y">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-6 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <ImpactBadge level={item.impactLevel} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.quantity} {item.unit} • {item.category}
                  </p>
                  {item.suggestedSwap && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                      <Leaf className="h-3.5 w-3.5" />
                      <span>
                        Try <strong>{item.suggestedSwap}</strong>
                        {item.swapSavingsKg && (
                          <> — save {item.swapSavingsKg.toFixed(1)} kg CO₂</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.carbonKg.toFixed(1)} kg</p>
                  <p className="text-xs text-muted-foreground">CO₂e</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">AI Insights</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {insights}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
