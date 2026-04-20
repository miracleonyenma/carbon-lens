"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Leaf,
  ScanLine,
  TrendingDown,
  ShoppingCart,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CarbonTrendChart,
  CategoryBreakdownChart,
} from "@/components/carbon/carbon-chart";
import { ImpactBadge } from "@/components/carbon/impact-badge";

interface Stats {
  overview: {
    totalScans: number;
    totalCarbonKg: number;
    totalItems: number;
    avgCarbonPerReceipt: number;
  };
  monthlyTrend: { month: string; totalCarbonKg: number; scans: number }[];
  categoryBreakdown: {
    category: string;
    totalCarbonKg: number;
    itemCount: number;
  }[];
  impactDistribution: { level: string; count: number; totalCarbonKg: number }[];
}

interface RecentReceipt {
  id: string;
  storeName?: string;
  totalCarbonKg: number;
  totalItems: number;
  createdAt: string;
  items: { impactLevel: "low" | "medium" | "high" }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, receiptsRes] = await Promise.all([
          fetch("/api/v1/receipts/stats"),
          fetch("/api/v1/receipts?limit=5"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (receiptsRes.ok) {
          const data = await receiptsRes.json();
          setRecentReceipts(data.receipts);
        }
      } catch {
        // silently fail — empty state shown
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-80 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  const hasData = stats && stats.overview.totalScans > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Track your shopping carbon footprint
          </p>
        </div>
        <Link href="/dashboard/scan">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Scan Receipt
          </Button>
        </Link>
      </div>

      {!hasData ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center"
        >
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Start tracking your impact</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Upload your first grocery receipt and let AI analyze the carbon
            footprint of your purchases.
          </p>
          <Link href="/dashboard/scan" className="mt-6">
            <Button size="lg" className="gap-2">
              <ScanLine className="h-5 w-5" />
              Scan Your First Receipt
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<ScanLine className="h-5 w-5" />}
              label="Total Scans"
              value={stats.overview.totalScans.toString()}
              delay={0}
            />
            <StatCard
              icon={<Leaf className="h-5 w-5" />}
              label="Total CO₂"
              value={`${stats.overview.totalCarbonKg.toFixed(1)} kg`}
              delay={0.05}
            />
            <StatCard
              icon={<ShoppingCart className="h-5 w-5" />}
              label="Items Tracked"
              value={stats.overview.totalItems.toString()}
              delay={0.1}
            />
            <StatCard
              icon={<TrendingDown className="h-5 w-5" />}
              label="Avg per Receipt"
              value={`${stats.overview.avgCarbonPerReceipt.toFixed(1)} kg`}
              delay={0.15}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border bg-card p-6"
            >
              <h3 className="mb-4 font-semibold">Monthly Carbon Trend</h3>
              <CarbonTrendChart data={stats.monthlyTrend} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl border bg-card p-6"
            >
              <h3 className="mb-4 font-semibold">Category Breakdown</h3>
              <CategoryBreakdownChart data={stats.categoryBreakdown} />
            </motion.div>
          </div>

          {/* Recent scans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border bg-card"
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="font-semibold">Recent Scans</h3>
              <Link
                href="/dashboard/history"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y">
              {recentReceipts.map((receipt) => {
                const highCount = receipt.items.filter(
                  (i) => i.impactLevel === "high"
                ).length;
                return (
                  <Link
                    key={receipt.id}
                    href={`/dashboard/history`}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
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
                      {highCount > 0 && <ImpactBadge level="high" />}
                      <span className="font-semibold">
                        {receipt.totalCarbonKg.toFixed(1)} kg
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
