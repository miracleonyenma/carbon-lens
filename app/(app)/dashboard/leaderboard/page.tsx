"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Trophy, Leaf, Flame, TrendingUp } from "lucide-react";
import {
  LeaderboardTable,
  type LeaderboardEntryData,
} from "@/components/carbon/leaderboard-table";
import {
  EcoScoreRing,
  TierBadge,
} from "@/components/carbon/leaderboard-badges";
import { SubmitScoreDialog } from "@/components/carbon/submit-score-dialog";
import { TIER_CONFIG } from "@/lib/eco-score";
import type { EcoTier } from "@/lib/eco-score";

const PAGE_SIZE = 25;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [total, setTotal] = useState(0);
  const [myEntry, setMyEntry] = useState<
    (LeaderboardEntryData & { rank: number }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (offset = 0, append = false) => {
    try {
      const res = await fetch(
        `/api/v1/leaderboard?limit=${PAGE_SIZE}&offset=${offset}`
      );
      if (!res.ok) return;
      const data = await res.json();

      setEntries((prev) =>
        append ? [...prev, ...data.entries] : data.entries
      );
      setTotal(data.total);
      if (data.myEntry) setMyEntry(data.myEntry);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleLoadMore = () => {
    fetchLeaderboard(entries.length, true);
  };

  const handleSubmitted = () => {
    setLoading(true);
    fetchLeaderboard();
  };

  // Top 3 podium
  const topThree = entries.slice(0, 3);

  return (
    <div className="w-full mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            See how your eco footprint compares to the community
          </p>
        </div>
        <SubmitScoreDialog onSubmitted={handleSubmitted} />
      </div>

      {/* My rank card */}
      {myEntry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border bg-card p-6"
        >
          <div className="flex flex-wrap items-center gap-6">
            <EcoScoreRing score={myEntry.ecoScore} tier={myEntry.tier} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{myEntry.nickname}</span>
                <TierBadge tier={myEntry.tier} />
              </div>
              <p className="text-sm text-muted-foreground">
                Rank{" "}
                <span className="font-semibold text-foreground">
                  #{myEntry.rank}
                </span>{" "}
                of {total} players
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Leaf className="h-3.5 w-3.5" />
                </div>
                <div className="mt-0.5 font-semibold">
                  {Math.round(myEntry.lowImpactRatio * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Low impact</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <div className="mt-0.5 font-semibold">
                  {myEntry.streakWeeks}w
                </div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <div className="mt-0.5 font-semibold">
                  {myEntry.avgCarbonPerItem} kg
                </div>
                <div className="text-xs text-muted-foreground">Avg/item</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium for top 3 */}
      {!loading && topThree.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 hidden sm:block"
        >
          <div className="flex items-end justify-center gap-4">
            {/* 2nd place */}
            <PodiumCard entry={topThree[1]} height="h-28" />
            {/* 1st place */}
            <PodiumCard entry={topThree[0]} height="h-36" isFirst />
            {/* 3rd place */}
            <PodiumCard entry={topThree[2]} height="h-24" />
          </div>
        </motion.div>
      )}

      {/* Tier legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
      >
        <span className="font-medium">Tiers:</span>
        {(Object.keys(TIER_CONFIG) as EcoTier[]).map((tier) => (
          <TierBadge key={tier} tier={tier} />
        ))}
      </motion.div>

      {/* Main table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border bg-card overflow-hidden"
      >
        <LeaderboardTable
          entries={entries}
          myEntry={myEntry}
          total={total}
          loading={loading}
          onLoadMore={handleLoadMore}
          hasMore={entries.length < total}
        />
      </motion.div>
    </div>
  );
}

function PodiumCard({
  entry,
  height,
  isFirst,
}: {
  entry: LeaderboardEntryData;
  height: string;
  isFirst?: boolean;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex w-32 flex-col items-center">
      <div className="mb-2 text-2xl">{medals[entry.rank - 1]}</div>
      <div
        className={cn(
          "w-full rounded-t-xl border border-b-0 px-3 pt-4 pb-3 text-center",
          height,
          isFirst
            ? "bg-gradient-to-t from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10"
            : "bg-muted/30"
        )}
      >
        <div className="truncate text-sm font-semibold">{entry.nickname}</div>
        <div className="mt-1 text-2xl font-bold">{entry.ecoScore}</div>
        <TierBadge tier={entry.tier} className="mt-1" />
      </div>
    </div>
  );
}
