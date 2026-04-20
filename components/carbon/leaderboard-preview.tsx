"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Shield, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TierBadge } from "./leaderboard-badges";
import { Button } from "@/components/ui/button";
import type { EcoTier } from "@/lib/eco-score";

interface PreviewEntry {
  _id: string;
  rank: number;
  nickname: string;
  ecoScore: number;
  tier: EcoTier;
  isVerified: boolean;
  country?: string;
  totalScans: number;
  streakWeeks: number;
}

// Static fallback data shown when the API hasn't returned yet or has no entries
const PLACEHOLDER_ENTRIES: PreviewEntry[] = [
  {
    _id: "p1",
    rank: 1,
    nickname: "Ava G.",
    ecoScore: 82,
    tier: "guardian",
    isVerified: true,
    country: "SE",
    totalScans: 34,
    streakWeeks: 8,
  },
  {
    _id: "p2",
    rank: 2,
    nickname: "Liam K.",
    ecoScore: 74,
    tier: "grove",
    isVerified: true,
    country: "CA",
    totalScans: 28,
    streakWeeks: 6,
  },
  {
    _id: "p3",
    rank: 3,
    nickname: "EcoShopper",
    ecoScore: 68,
    tier: "grove",
    isVerified: false,
    country: "US",
    totalScans: 19,
    streakWeeks: 4,
  },
  {
    _id: "p4",
    rank: 4,
    nickname: "Mina R.",
    ecoScore: 55,
    tier: "grove",
    isVerified: true,
    country: "DE",
    totalScans: 15,
    streakWeeks: 3,
  },
  {
    _id: "p5",
    rank: 5,
    nickname: "GreenCart",
    ecoScore: 41,
    tier: "sprout",
    isVerified: false,
    country: "NG",
    totalScans: 9,
    streakWeeks: 2,
  },
];

function RankDisplay({ rank }: { rank: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  if (rank <= 3) {
    return <span className="text-lg">{medals[rank - 1]}</span>;
  }
  return (
    <span className="text-sm font-medium text-muted-foreground">{rank}</span>
  );
}

export function LeaderboardPreview() {
  const [entries, setEntries] = useState<PreviewEntry[]>(PLACEHOLDER_ENTRIES);
  const [total, setTotal] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchTop() {
      try {
        const res = await fetch("/api/v1/leaderboard?limit=5&offset=0");
        if (!res.ok) return;
        const data = await res.json();
        if (data.entries && data.entries.length > 0) {
          setEntries(data.entries);
          setTotal(data.total);
          setIsLive(true);
        }
      } catch {
        // keep placeholders
      }
    }
    fetchTop();
  }, []);

  return (
    <div className="w-full rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
            <Trophy className="size-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold">Eco Leaderboard</h3>
            <p className="text-xs text-muted-foreground">
              {isLive
                ? `${total} players ranked by Eco Score`
                : "Top eco-shoppers ranked by impact"}
            </p>
          </div>
        </div>
        <Link href="/dashboard/leaderboard">
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
            View all <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      {/* Entries */}
      <div className="divide-y">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className={cn(
              "flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/30",
              entry.rank <= 3 && "bg-muted/20"
            )}
          >
            {/* Rank */}
            <div className="flex w-8 shrink-0 justify-center">
              <RankDisplay rank={entry.rank} />
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">
                  {entry.nickname}
                </span>
                {entry.isVerified ? (
                  <Shield className="size-3.5 shrink-0 text-blue-500" />
                ) : (
                  <Users className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{entry.totalScans} scans</span>
                {entry.country && (
                  <>
                    <span>·</span>
                    <span>{entry.country}</span>
                  </>
                )}
              </div>
            </div>

            {/* Tier */}
            <div className="hidden sm:block">
              <TierBadge tier={entry.tier} />
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="text-base font-bold tabular-nums">
                {entry.ecoScore}
              </div>
              <div className="text-xs text-muted-foreground sm:hidden">
                <TierBadge tier={entry.tier} showLabel={false} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="border-t bg-muted/20 px-6 py-4 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          Scan a receipt to get your Eco Score and join the rankings
        </p>
        <Button size="sm" asChild>
          <Link href="/dashboard/scan" className="gap-2">
            Start Scanning <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
