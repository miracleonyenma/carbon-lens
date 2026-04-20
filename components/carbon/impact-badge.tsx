import { cn } from "@/lib/utils";

interface ImpactBadgeProps {
  level: "low" | "medium" | "high";
  className?: string;
}

const config = {
  low: {
    label: "Low",
    emoji: "🟢",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    emoji: "🟡",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  high: {
    label: "High",
    emoji: "🔴",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function ImpactBadge({ level, className }: ImpactBadgeProps) {
  const { label, emoji, className: badgeClass } = config[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeClass,
        className,
      )}
    >
      {emoji} {label}
    </span>
  );
}
