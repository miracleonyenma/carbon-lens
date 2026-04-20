import type { GeoResult } from "@/utils/geoip";

type ClimateSignalId =
  | "temperature"
  | "renewables"
  | "ice"
  | "forest"
  | "species"
  | "plastic";

export type ClimateSignal = {
  id: ClimateSignalId;
  label: string;
  value: string;
  unitLabel: string;
  description: string;
  source: string;
};

export type ClimateContext = {
  co2: {
    latestPpm: number;
    latestDate: string;
    ytdHighPpm: number;
    ytdAveragePpm: number;
    since1974DeltaPpm: number;
    source: string;
    isFallback: boolean;
  };
  signals: ClimateSignal[];
  promptContext: string;
};

type Co2Reading = {
  date: string;
  year: number;
  ppm: number;
};

const REPORT_YEAR = 2026;
const NOAA_DAILY_CO2_CSV =
  "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv";
const CO2_SOURCE = "NOAA GML · Mauna Loa · preliminary daily readings";

const SIGNALS: ClimateSignal[] = [
  {
    id: "temperature",
    label: "Global temperature",
    value: "+1.55",
    unitLabel: "deg C",
    description: "Above preindustrial baseline",
    source: "NASA GISS · NOAA",
  },
  {
    id: "renewables",
    label: "Clean energy growth",
    value: "+32",
    unitLabel: "percent",
    description: "Year-over-year renewable growth",
    source: "IEA · IRENA",
  },
  {
    id: "ice",
    label: "Ice lost",
    value: "1.17",
    unitLabel: "trillion tonnes",
    description: "Annual cryosphere net loss",
    source: "NASA GRACE-FO · NSIDC",
  },
  {
    id: "forest",
    label: "Forest lost",
    value: "14.9",
    unitLabel: "million hectares",
    description: "Annual tree cover loss",
    source: "Global Forest Watch · WRI",
  },
  {
    id: "species",
    label: "Species threatened",
    value: "41,046",
    unitLabel: "species",
    description: "Threatened species on record",
    source: "IUCN Red List · WWF LPR",
  },
  {
    id: "plastic",
    label: "Plastic produced",
    value: "413",
    unitLabel: "million tonnes",
    description: "Annual plastic production",
    source: "OECD · UNEP",
  },
];

const FALLBACK_CO2: ClimateContext["co2"] = {
  latestPpm: 429.36,
  latestDate: "2026-04-16",
  ytdHighPpm: 433.24,
  ytdAveragePpm: 429.63,
  since1974DeltaPpm: 95.9,
  source: CO2_SOURCE,
  isFallback: true,
};

function roundPpm(value: number) {
  return Math.round(value * 100) / 100;
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function parseNoaaDailyCsv(csv: string): Co2Reading[] {
  return csv
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line && !line.startsWith("#") && !line.toLowerCase().startsWith("year")
    )
    .map((line) => line.split(",").map((cell) => cell.trim()))
    .flatMap((row) => {
      if (row.length < 5) return [];

      const year = Number.parseInt(row[0], 10);
      const month = Number.parseInt(row[1], 10);
      const day = Number.parseInt(row[2], 10);
      const ppm = Number.parseFloat(row[4]);

      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day)
      ) {
        return [];
      }

      if (!Number.isFinite(ppm) || ppm < 0) return [];

      return [{ date: toIsoDate(year, month, day), year, ppm }];
    });
}

async function fetchCo2Context(): Promise<ClimateContext["co2"]> {
  try {
    const response = await fetch(NOAA_DAILY_CO2_CSV, {
      next: { revalidate: 60 * 60 * 12 },
    });

    if (!response.ok) return FALLBACK_CO2;

    const csv = await response.text();
    const readings = parseNoaaDailyCsv(csv);
    const latest = readings.at(-1);
    const first = readings[0];
    const yearReadings = readings.filter(
      (reading) => reading.year === REPORT_YEAR
    );

    if (!latest || !first || yearReadings.length === 0) return FALLBACK_CO2;

    const ytdHigh = yearReadings.reduce((high, reading) =>
      reading.ppm > high.ppm ? reading : high
    );
    const ytdTotal = yearReadings.reduce(
      (total, reading) => total + reading.ppm,
      0
    );

    return {
      latestPpm: roundPpm(latest.ppm),
      latestDate: latest.date,
      ytdHighPpm: roundPpm(ytdHigh.ppm),
      ytdAveragePpm: roundPpm(ytdTotal / yearReadings.length),
      since1974DeltaPpm: roundPpm(latest.ppm - first.ppm),
      source: CO2_SOURCE,
      isFallback: false,
    };
  } catch {
    return FALLBACK_CO2;
  }
}

function buildPromptContext(co2: ClimateContext["co2"]) {
  const globalSignals = SIGNALS.map(
    (signal) =>
      `${signal.label}: ${signal.value} ${signal.unitLabel} (${signal.description}; ${signal.source})`
  ).join("; ");

  return [
    `Atmospheric CO2: ${co2.latestPpm} ppm on ${co2.latestDate} (${co2.source}).`,
    `2026 CO2 year-to-date average: ${co2.ytdAveragePpm} ppm; year-to-date high: ${co2.ytdHighPpm} ppm; change since 1974: +${co2.since1974DeltaPpm} ppm.`,
    `Additional global context: ${globalSignals}.`,
    "Use this context only to write sharper, more grounded user insights. Do not change item-level carbon estimates solely because of these macro figures.",
  ].join(" ");
}

export async function getClimateContext(): Promise<ClimateContext> {
  const co2 = await fetchCo2Context();

  return {
    co2,
    signals: SIGNALS,
    promptContext: buildPromptContext(co2),
  };
}

export function buildAnalysisContext(
  climate: ClimateContext,
  geo?: GeoResult | null
) {
  if (!geo?.country) return climate.promptContext;

  const geoParts = [
    `User region hint: country ${geo.country}.`,
    geo.currency ? `Likely local currency: ${geo.currency}.` : null,
    geo.source ? `Geo source: ${geo.source}.` : null,
    "Use this regional hint only to make user-facing insights and swap suggestions feel locally relevant when reasonable.",
    "Do not fabricate exact regional lifecycle factors, policy claims, or prices if they are not present in the input.",
  ].filter(Boolean);

  return `${climate.promptContext} ${geoParts.join(" ")}`;
}
