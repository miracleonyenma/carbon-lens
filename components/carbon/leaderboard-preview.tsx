"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Verified, Users, ArrowRight } from "lucide-react";
import SummaryCard, {
  type SummaryItem,
} from "@/components/ui/aevr/summary-card";
import { TierBadge } from "./leaderboard-badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

const medals = ["🥇", "🥈", "🥉"];

function EntryLabel({ entry }: { entry: PreviewEntry }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">
        {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
      </span>
      <span className="font-medium text-neutral-900 dark:text-neutral-100">
        {entry.nickname}
      </span>
      {entry.isVerified ? (
        <Verified className="size-3.5 shrink-0 text-blue-500" />
      ) : (
        <Users className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      {entry.country && (
        <span className="text-xs text-muted-foreground">{entry.country}</span>
      )}
    </div>
  );
}

function EntryValue({ entry }: { entry: PreviewEntry }) {
  return (
    <div className="flex items-center gap-2">
      <TierBadge tier={entry.tier} />
      <span className="text-lg font-bold tabular-nums">{entry.ecoScore}</span>
    </div>
  );
}

export function LeaderboardPreview() {
  const [entries, setEntries] = useState<PreviewEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTop() {
      try {
        const res = await fetch("/api/v1/leaderboard?limit=5&offset=0");
        if (!res.ok) return;
        const data = await res.json();
        if (data.entries && data.entries.length > 0) {
          setEntries(data.entries);
          setTotal(data.total);
        }
      } catch {
        // leave entries null
      } finally {
        setLoading(false);
      }
    }
    fetchTop();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <Trophy className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          No rankings yet — be the first to{" "}
          <Link href="/dashboard/scan" className="text-primary underline">
            scan something
          </Link>{" "}
          and claim the top spot.
        </p>
      </div>
    );
  }

  const items: SummaryItem[] = entries.map((entry) => ({
    label: `${entry.totalScans} scans · ${entry.streakWeeks}w streak`,
    value: <EntryLabel entry={entry} />,
    content: <EntryValue entry={entry} />,
  }));

  const summaryItem: SummaryItem = {
    label: "Total ranked players",
    value: (
      <span className="font-medium text-neutral-900 dark:text-neutral-100">
        {total} players competing
      </span>
    ),
    content: (
      <Link href="/dashboard/leaderboard">
        <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
          View full leaderboard <ArrowRight className="size-3.5" />
        </Button>
      </Link>
    ),
  };

  return <SummaryCard items={items} summary={summaryItem} />;
}
