"use client";

import {
  Cloud,
  Thermometer,
  Trees,
  Snowflake,
  Recycle,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { SplitProgressBar } from "@/components/ui/aevr/progress";
import { StatCard } from "@/components/ui/aevr/stat-card";
import { cn } from "@/lib/utils";
import type { ClimateContext as ClimateContextData } from "@/lib/climate";

type RegionContext = {
  country?: string;
  currency?: string;
  source?: string;
};

const signalIcons = {
  temperature: Thermometer,
  renewables: Zap,
  ice: Snowflake,
  forest: Trees,
  species: ShieldAlert,
  plastic: Recycle,
} as const;

const signalAccent = {
  temperature: "bg-orange-500",
  renewables: "bg-amber-500",
  ice: "bg-sky-500",
  forest: "bg-emerald-500",
  species: "bg-violet-500",
  plastic: "bg-slate-500",
} as const;

export function ClimateContext({
  climate,
  regionContext,
}: {
  climate: ClimateContextData;
  regionContext?: RegionContext | null;
}) {
  const preindustrialBaseline = 280;
  const co2AboveBaseline = climate.co2.latestPpm - preindustrialBaseline;
  const co2PercentAboveBaseline = (co2AboveBaseline / preindustrialBaseline) * 100;
  const co2Progress = clampPercent((climate.co2.latestPpm / 450) * 100);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Global Climate Context
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live atmospheric CO2 plus wider planetary signals to frame your
          personal footprint.
        </p>
        {regionContext?.country && (
          <p className="mt-2 text-xs text-muted-foreground">
            Regional context for AI insights: {regionContext.country}
            {regionContext.currency ? ` · ${regionContext.currency}` : ""}
            {regionContext.source
              ? ` · ${humanizeGeoSource(regionContext.source)}`
              : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatCard
          className="xl:col-span-3"
          label={
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Cloud className="h-4 w-4" />
              </span>
              <span>Atmospheric CO2</span>
            </div>
          }
          value={
            <>
              {climate.co2.latestPpm.toFixed(2)}
              <span className="text-muted-foreground ml-1 text-base font-medium">
                ppm
              </span>
            </>
          }
          stats={[
            {
              label: "Above preindustrial",
              value: `+${co2PercentAboveBaseline.toFixed(1)}%`,
            },
            {
              label: `${new Date(climate.co2.latestDate).getFullYear()} average`,
              value: `${climate.co2.ytdAveragePpm.toFixed(2)} ppm`,
            },
            {
              label: `${new Date(climate.co2.latestDate).getFullYear()} peak`,
              value: `${climate.co2.ytdHighPpm.toFixed(2)} ppm`,
            },
            {
              label: "Since 1974",
              value: `+${climate.co2.since1974DeltaPpm.toFixed(2)} ppm`,
            },
          ]}
          footerLabel={
            <>
              Latest reading on {new Date(climate.co2.latestDate).toLocaleDateString()} · {climate.co2.source}
              {climate.co2.isFallback ? " (fallback)" : ""}
            </>
          }
        >
          <div className="w-full space-y-2">
            <SplitProgressBar value={co2Progress} barHeight={18} />
            <span className="text-muted-foreground text-xs">
              {co2AboveBaseline.toFixed(2)} ppm above the 280 ppm preindustrial baseline.
            </span>
          </div>
        </StatCard>

        {climate.signals.map((signal) => {
          const Icon = signalIcons[signal.id];
          const derived = deriveSignalMetrics(signal);

          return (
            <StatCard
              key={signal.id}
              label={
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{signal.label}</span>
                </div>
              }
              value={
                <>
                  {signal.value}
                  <span className="text-muted-foreground ml-1 text-sm font-medium">
                    {signal.unitLabel}
                  </span>
                </>
              }
              stats={[
                { label: derived.comparisonLabel, value: derived.comparisonValue },
                { label: "Source", value: signal.source },
              ]}
              footerLabel={signal.description}
            >
              <div className="w-full space-y-2">
                <SplitProgressBar
                  value={derived.progressValue}
                  barHeight={18}
                  filledClassName={cn(signalAccent[signal.id])}
                />
                <span className="text-muted-foreground text-xs">
                  {derived.progressCaption}
                </span>
              </div>
            </StatCard>
          );
        })}
      </div>
    </div>
  );
}

function deriveSignalMetrics(signal: ClimateContextData["signals"][number]) {
  switch (signal.id) {
    case "temperature": {
      const current = Number.parseFloat(signal.value);
      const overParisGoal = current - 1.5;
      return {
        comparisonLabel: "Above Paris goal",
        comparisonValue: `${overParisGoal >= 0 ? "+" : ""}${overParisGoal.toFixed(2)} deg C`,
        progressValue: clampPercent((current / 2) * 100),
        progressCaption: `${current.toFixed(2)} deg C as a share of a 2.0 deg C warming line.`,
      };
    }
    case "renewables": {
      const growth = Number.parseFloat(signal.value);
      return {
        comparisonLabel: "Per 10-point move",
        comparisonValue: `${(growth / 10).toFixed(1)}x`,
        progressValue: clampPercent(growth),
        progressCaption: `${growth.toFixed(0)}% year-over-year renewable growth.`,
      };
    }
    case "ice": {
      const totalTonnes = Number.parseFloat(signal.value) * 1_000_000_000_000;
      const tonnesPerSecond = totalTonnes / (365 * 24 * 60 * 60);
      return {
        comparisonLabel: "Average per second",
        comparisonValue: `${formatCompact(tonnesPerSecond)} tonnes`,
        progressValue: clampPercent((Number.parseFloat(signal.value) / 1.5) * 100),
        progressCaption: `${signal.value} trillion tonnes relative to a 1.5 trillion-tonne reference.`,
      };
    }
    case "forest": {
      const hectaresPerHour = (Number.parseFloat(signal.value) * 1_000_000) / (365 * 24);
      return {
        comparisonLabel: "Average per hour",
        comparisonValue: `${formatCompact(hectaresPerHour)} hectares`,
        progressValue: clampPercent((Number.parseFloat(signal.value) / 20) * 100),
        progressCaption: `${signal.value} million hectares relative to a 20 million-hectare marker.`,
      };
    }
    case "species": {
      const threatened = Number.parseInt(signal.value.replace(/,/g, ""), 10);
      const assessed = 157_100;
      return {
        comparisonLabel: "Of assessed species",
        comparisonValue: `${((threatened / assessed) * 100).toFixed(1)}%`,
        progressValue: clampPercent((threatened / assessed) * 100),
        progressCaption: `${signal.value} threatened out of roughly ${assessed.toLocaleString()} assessed species.`,
      };
    }
    case "plastic": {
      const tonnesPerDay = (Number.parseFloat(signal.value) * 1_000_000) / 365;
      return {
        comparisonLabel: "Average per day",
        comparisonValue: `${formatCompact(tonnesPerDay)} tonnes`,
        progressValue: clampPercent((Number.parseFloat(signal.value) / 500) * 100),
        progressCaption: `${signal.value} million tonnes relative to a 500 million-tonne marker.`,
      };
    }
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function humanizeGeoSource(source: string) {
  switch (source) {
    case "user_profile":
      return "saved profile region";
    case "vercel_header":
      return "request country header";
    case "ipinfo":
      return "IP geolocation";
    default:
      return source.replace(/_/g, " ");
  }
}
