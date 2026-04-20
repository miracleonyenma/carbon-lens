import type { EcoTier } from "@/lib/models/LeaderboardEntry";
export type { EcoTier };

export interface EcoScoreInput {
  items: {
    carbonKg: number;
    impactLevel: "low" | "medium" | "high";
    swapSavingsKg?: number;
  }[];
  totalScans: number;
  /** ISO date strings of each scan, used to compute weekly streak */
  scanDates: string[];
}

export interface EcoScoreResult {
  ecoScore: number;
  tier: EcoTier;
  lowImpactRatio: number;
  avgCarbonPerItem: number;
  streakWeeks: number;
  totalItems: number;
}

/**
 * Compute the weekly scan streak: consecutive weeks ending at the current week
 * where the user had at least one scan.
 */
function computeStreakWeeks(scanDates: string[]): number {
  if (scanDates.length === 0) return 0;

  // Get the ISO week number for a date (Mon=start)
  const toWeekKey = (d: Date) => {
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor(
      (d.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)
    );
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  };

  const weekSet = new Set(scanDates.map((d) => toWeekKey(new Date(d))));

  let streak = 0;
  const now = new Date();
  const cursor = new Date(now);

  // Walk backwards week by week from current week
  for (let i = 0; i < 52; i++) {
    const key = toWeekKey(cursor);
    if (weekSet.has(key)) {
      streak++;
    } else if (i > 0) {
      // Allow current week to be missing (week in progress)
      break;
    }
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

/**
 * Compute the composite Eco Score (0–100).
 *
 * Components:
 *   - Low-impact ratio   (30%) — % of items classified as "low"
 *   - Swap awareness      (25%) — ratio of items with meaningful swap savings
 *   - Carbon efficiency   (25%) — inverse of avg carbon per item, normalized
 *   - Scan streak         (20%) — consecutive weeks with ≥1 scan (capped at 12)
 */
export function computeEcoScore(input: EcoScoreInput): EcoScoreResult {
  const totalItems = input.items.length;

  if (totalItems === 0 || input.totalScans === 0) {
    return {
      ecoScore: 0,
      tier: "seedling",
      lowImpactRatio: 0,
      avgCarbonPerItem: 0,
      streakWeeks: 0,
      totalItems: 0,
    };
  }

  // 1. Low-impact ratio (0–1)
  const lowCount = input.items.filter((i) => i.impactLevel === "low").length;
  const lowImpactRatio = lowCount / totalItems;

  // 2. Swap awareness (0–1): fraction of items where a swap saves ≥ 0.5 kg
  const swapAwareCount = input.items.filter(
    (i) => (i.swapSavingsKg ?? 0) >= 0.5
  ).length;
  const swapAwareness = swapAwareCount / totalItems;

  // 3. Carbon efficiency (0–1): lower avg = better, cap at 5 kg/item
  const avgCarbonPerItem =
    input.items.reduce((s, i) => s + i.carbonKg, 0) / totalItems;
  const cappedAvg = Math.min(avgCarbonPerItem, 5);
  const carbonEfficiency = 1 - cappedAvg / 5;

  // 4. Streak (0–1): consecutive weeks, capped at 12
  const streakWeeks = computeStreakWeeks(input.scanDates);
  const streakScore = Math.min(streakWeeks / 12, 1);

  // Weighted composite
  const raw =
    lowImpactRatio * 30 +
    swapAwareness * 25 +
    carbonEfficiency * 25 +
    streakScore * 20;

  const ecoScore = Math.round(Math.min(Math.max(raw, 0), 100) * 10) / 10;

  return {
    ecoScore,
    tier: getTier(ecoScore),
    lowImpactRatio: Math.round(lowImpactRatio * 1000) / 1000,
    avgCarbonPerItem: Math.round(avgCarbonPerItem * 100) / 100,
    streakWeeks,
    totalItems,
  };
}

export function getTier(score: number): EcoTier {
  if (score >= 76) return "guardian";
  if (score >= 51) return "grove";
  if (score >= 26) return "sprout";
  return "seedling";
}

export const TIER_CONFIG: Record<
  EcoTier,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  seedling: {
    label: "Seedling",
    emoji: "🌱",
    color: "text-lime-700 dark:text-lime-400",
    bgColor: "bg-lime-100 dark:bg-lime-900/30",
  },
  sprout: {
    label: "Sprout",
    emoji: "🌿",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  grove: {
    label: "Grove",
    emoji: "🌳",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  guardian: {
    label: "Guardian",
    emoji: "🌍",
    color: "text-teal-700 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
  },
};

/**
 * Plausibility check for community (unverified) submissions.
 * Returns an error message if implausible, or null if OK.
 */
export function validateCommunitySubmission(input: {
  totalScans: number;
  totalItems: number;
  avgCarbonPerItem: number;
  lowImpactRatio: number;
  ecoScore: number;
}): string | null {
  if (input.totalScans < 1) return "Must have at least 1 scan";
  if (input.totalItems < 1) return "Must have at least 1 item";
  if (input.avgCarbonPerItem < 0.01)
    return "Average carbon per item is implausibly low";
  if (input.avgCarbonPerItem > 50)
    return "Average carbon per item is implausibly high";
  if (input.lowImpactRatio < 0 || input.lowImpactRatio > 1)
    return "Invalid low-impact ratio";
  if (input.ecoScore < 0 || input.ecoScore > 100) return "Invalid eco score";
  if (input.totalItems / input.totalScans > 200)
    return "Too many items per scan";
  return null;
}
