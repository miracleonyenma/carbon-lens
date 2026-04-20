"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Original progress bar (unchanged)
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted relative flex h-3 w-full items-center overflow-x-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary size-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

// Split bar progress variant
interface SplitProgressBarProps {
  /** Progress value from 0–100 */
  value?: number;
  /**
   * Number of bar segments.
   * Defaults to 20. When omitted, the component auto-calculates
   * based on container width via a ResizeObserver.
   */
  bars?: number;
  /** Height of each bar segment in px. Defaults to 40. */
  barHeight?: number;
  /** Gap between bar segments in px. Defaults to 2. */
  gap?: number;
  /** Custom class for the root element */
  className?: string;
  /** Custom class applied to filled bar segments */
  filledClassName?: string;
  /** Custom class applied to empty bar segments */
  emptyClassName?: string;
}

function SplitProgressBar({
  value = 0,
  bars,
  barHeight = 40,
  gap = 2,
  className,
  filledClassName,
  emptyClassName,
}: SplitProgressBarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [autoBarCount, setAutoBarCount] = React.useState(20);

  // If `bars` prop is not provided, derive count from container width
  React.useEffect(() => {
    if (bars !== undefined) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // Each bar is ~10px wide + gap — gives a dense-but-readable default
        const barWidth = 10;
        const count = Math.max(1, Math.floor(width / (barWidth + gap)));
        setAutoBarCount(count);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [bars, gap]);

  const totalBars = bars ?? autoBarCount;
  const filledCount = Math.round(
    (Math.min(100, Math.max(0, value)) / 100) * totalBars,
  );

  return (
    <div
      ref={containerRef}
      data-slot="split-progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("flex w-full items-center", className)}
      style={{ gap }}
    >
      {Array.from({ length: totalBars }, (_, i) => (
        <div
          key={i}
          data-slot="split-progress-bar"
          data-filled={i < filledCount ? "" : undefined}
          className={cn(
            "flex-1 rounded-sm transition-colors duration-300",
            i < filledCount
              ? cn("bg-primary", filledClassName)
              : cn("bg-muted", emptyClassName),
          )}
          style={{ height: barHeight }}
        />
      ))}
    </div>
  );
}

export { Progress, SplitProgressBar };
