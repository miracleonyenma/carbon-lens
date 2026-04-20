"use client";

import { cn } from "@/lib/utils";
import { TIER_CONFIG, type EcoTier } from "@/lib/eco-score";

interface TierBadgeProps {
  tier: EcoTier;
  className?: string;
  showLabel?: boolean;
}

export function TierBadge({
  tier,
  className,
  showLabel = true,
}: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.emoji} {showLabel && config.label}
    </span>
  );
}

interface EcoScoreRingProps {
  score: number;
  tier: EcoTier;
  size?: number;
  className?: string;
}

export function EcoScoreRing({
  score,
  tier,
  size = 80,
  className,
}: EcoScoreRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const tierColors: Record<EcoTier, string> = {
    seedling: "#84cc16",
    sprout: "#10b981",
    grove: "#22c55e",
    guardian: "#14b8a6",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tierColors[tier]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{score}</span>
      </div>
    </div>
  );
}
