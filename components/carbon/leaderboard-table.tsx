"use client";

import { motion } from "motion/react";
import {
  Trophy,
  Medal,
  Award,
  Verified,
  Users,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TierBadge } from "./leaderboard-badges";
import type { EcoTier } from "@/lib/eco-score";
import { Button } from "@/components/ui/button";

export interface LeaderboardEntryData {
  _id: string;
  rank: number;
  nickname: string;
  ecoScore: number;
  totalScans: number;
  totalItems: number;
  lowImpactRatio: number;
  avgCarbonPerItem: number;
  streakWeeks: number;
  tier: EcoTier;
  isVerified: boolean;
  country?: string;
  lastUpdated: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntryData[];
  myEntry?: (LeaderboardEntryData & { rank: number }) | null;
  total: number;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(char.codePointAt(0)! - 65 + 0x1f1e6)
    );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-sm font-medium text-muted-foreground">
      {rank}
    </span>
  );
}

function EntryRow({
  entry,
  isMe,
  index,
}: {
  entry: LeaderboardEntryData;
  isMe: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6",
        isMe && "bg-primary/5 border-l-2 border-primary",
        entry.rank <= 3 && !isMe && "bg-muted/30"
      )}
    >
      {/* Rank */}
      <div className="flex w-8 shrink-0 justify-center">
        <RankIcon rank={entry.rank} />
      </div>

      {/* Name + tier */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate font-medium",
              isMe && "text-primary font-semibold"
            )}
          >
            {entry.nickname}
          </span>
          {entry.isVerified && (
            <Verified className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          )}
          {!entry.isVerified && (
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{entry.totalScans} scans</span>
          <span>·</span>
          <span>{entry.streakWeeks}w streak</span>
          {entry.country && (
            <>
              <span>·</span>
              <span title={entry.country}>
                {countryCodeToFlag(entry.country)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tier badge */}
      <div className="hidden sm:block">
        <TierBadge tier={entry.tier} />
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-lg font-bold tabular-nums">{entry.ecoScore}</div>
        <div className="text-xs text-muted-foreground sm:hidden">
          <TierBadge tier={entry.tier} showLabel={false} />
        </div>
      </div>
    </motion.div>
  );
}

export function LeaderboardTable({
  entries,
  myEntry,
  total,
  loading,
  onLoadMore,
  hasMore,
}: LeaderboardTableProps) {
  const myId = myEntry?._id;

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3">
            <div className="h-5 w-8 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            <div className="h-6 w-10 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">No entries yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Be the first to join the leaderboard! Scan some receipts and submit
          your eco score.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* My rank highlight (if not visible in current page) */}
      {myEntry && !entries.some((e) => e._id === myId) && (
        <div className="border-b-2 border-dashed">
          <EntryRow entry={myEntry} isMe index={0} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:gap-4 sm:px-6">
        <div className="w-8 shrink-0 text-center">Rank</div>
        <div className="flex-1">Player</div>
        <div className="hidden sm:block">Tier</div>
        <div className="text-right">Score</div>
      </div>

      {/* Entries */}
      <div className="divide-y">
        {entries.map((entry, i) => (
          <EntryRow
            key={entry._id}
            entry={entry}
            isMe={entry._id === myId}
            index={i}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Show more ({total - entries.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
