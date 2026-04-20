import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/aevr/card";

export interface StatItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

interface StatCardProps {
  /** Primary stat — label on the left, value on the right */
  label: React.ReactNode;
  value: React.ReactNode;
  /**
   * Additional stat rows stacked below the primary one inside the inner card.
   * Each row shares the same label/value layout, separated by a hairline divider.
   */
  stats?: StatItem[];
  /**
   * Variant of the stats rows. Split stats are separated by a gap, stacked are separated by a border.
   */
  statsVariant?: "split" | "stacked";
  /** Freeform body content rendered below all stat rows (e.g. SplitProgressBar) */
  children?: React.ReactNode;
  /** Footer — left side (icon + text) */
  footerLabel?: React.ReactNode;
  /** Footer — right side (buttons / actions) */
  footerAction?: React.ReactNode;
  className?: string;
}

/**
 * StatCard
 *
 * Muted outer shell + white inner card.
 *
 * The primary stat (`label` + `value`) always appears at the top.
 * Pass `stats` to stack additional label/value rows below it — each row
 * is separated by a hairline divider and shares the same layout.
 * Freeform `children` (e.g. a SplitProgressBar) render after all rows.
 *
 * ```tsx
 * // Single stat
 * <StatCard label="Avg Latency" value={<>3423 <span>ms</span></>}
 *   footerLabel={<><Clock className="size-4" /> Last 30 days</>} />
 *
 * // Multiple stats
 * <StatCard
 *   label="Avg Latency"   value={<>3423 <span>ms</span></>}
 *   stats={[
 *     { label: "P95 Latency", value: <>8120 <span>ms</span></> },
 *     { label: "Cache hit rate", value: <>41 <span>%</span></> },
 *   ]}
 *   footerLabel={<><Clock className="size-4" /> Last 30 days</>}
 * />
 * ```
 */
export function StatCard({
  label,
  value,
  stats,
  statsVariant = "split",
  children,
  footerLabel,
  footerAction,
  className,
}: StatCardProps) {
  const extraStats = stats?.length ? stats : null;

  return (
    <Card variant="stat" className={cn("justify-between", className)}>
      {/* Inner white card */}
      <div
        className={cn(
          "bg-card rounded-lg",
          statsVariant == "split" && (stats?.length || 0) > 0 && "bg-muted"
        )}
      >
        {/* Primary stat row */}
        <CardHeader
          className={cn(
            "flex items-baseline-last justify-between gap-4 p-4",
            statsVariant == "split" &&
              (stats?.length || 0) > 0 &&
              "bg-card rounded-lg"
          )}
        >
          <span>{label}</span>
          <span className="text-2xl">{value}</span>
        </CardHeader>

        {/* Additional stat rows */}
        {extraStats && (
          <div
            className={cn(
              "flex flex-col",
              statsVariant == "split" && "bg-muted gap-2 pt-2"
            )}
          >
            {extraStats.map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "border-border/50 flex items-baseline justify-between gap-4 border-t-2 px-4 py-3",
                  statsVariant == "split" && "bg-card rounded-lg border-0 px-4"
                )}
              >
                <span className="text-muted-foreground text-sm">
                  {stat.label}
                </span>
                <span className="text-xl">{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Freeform body (e.g. SplitProgressBar) */}
        {children && (
          <CardContent
            className={cn(
              "flex flex-col items-end gap-1 p-0 px-4 pb-4",
              // Avoid double spacing when extra rows are also present
              !extraStats && "pt-0"
            )}
          >
            {children}
          </CardContent>
        )}
      </div>

      {(footerLabel || footerAction) && (
        <CardFooter className="p-0">
          <div className="flex w-full items-center justify-between gap-4 px-0">
            {footerLabel && (
              <div className="text-muted-foreground grow flex items-center gap-1 p-2 py-1 text-sm">
                {footerLabel}
              </div>
            )}
            {footerAction && <div className="flex gap-2">{footerAction}</div>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

{
  /* <Card className="bg-muted gap-3 border-0 p-1.5">
                <div className="bg-card rounded-lg">
                  <CardHeader className="flex items-baseline-last justify-between gap-4 p-4">
                    <span>Extractions Usage</span>
                    <span className="text-2xl">
                      {Math.ceil(
                        ((usageAnalytics?.summary.monthlyCount || 0) /
                          (usageAnalytics?.limits?.monthlyQuota || 1)) *
                          100,
                      )}
                      <span className="text-muted-foreground text-base">%</span>
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col items-end gap-1 px-4">
                      <SplitProgressBar
                        value={
                          (usageAnalytics?.summary.monthlyCount || 0) /
                          (usageAnalytics?.limits?.monthlyQuota || 1)
                        }
                        filledClassName="bg-primary"
                      />
                      <span>
                        {usageAnalytics?.summary.monthlyCount || 0} of{" "}
                        {usageAnalytics?.limits?.monthlyQuota || 0} requests
                      </span>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="p-0">
                  <div className="flex w-full items-center justify-between gap-4 px-0">
                    <span className="text-muted-foreground flex items-center gap-1 px-2">
                      <PieChart className="size-4" />
                      <span className="text-sm">Usage</span>
                    </span>

                    <div className="flex gap-2">
                      <Button asChild size={"sm"} variant={"modern"}>
                        <Link href={`/teams/${activeTeam?.team.slug}`}>
                          Upgrade
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card> */
}
