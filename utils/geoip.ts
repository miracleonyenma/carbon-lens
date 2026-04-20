/**
 * IP-based geolocation utility.
 *
 * Uses the ipinfo.io API (free tier: 50k requests/month).
 * Set IPINFO_TOKEN in your environment for authenticated requests.
 * If the token is absent or the call fails the function returns null fields
 * and registration continues without geodata.
 */

import { headers } from "next/headers";
import { logger } from "@untools/logger";

// ─── Country → Currency mapping (ISO 3166-1 → ISO 4217) ─────────────────────
// Covers the 180+ recognised currencies mapped to their primary country.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AD: "EUR",
  AE: "AED",
  AF: "AFN",
  AG: "XCD",
  AI: "XCD",
  AL: "ALL",
  AM: "AMD",
  AO: "AOA",
  AR: "ARS",
  AS: "USD",
  AT: "EUR",
  AU: "AUD",
  AW: "AWG",
  AX: "EUR",
  AZ: "AZN",
  BA: "BAM",
  BB: "BBD",
  BD: "BDT",
  BE: "EUR",
  BF: "XOF",
  BG: "BGN",
  BH: "BHD",
  BI: "BIF",
  BJ: "XOF",
  BL: "EUR",
  BM: "BMD",
  BN: "BND",
  BO: "BOB",
  BQ: "USD",
  BR: "BRL",
  BS: "BSD",
  BT: "BTN",
  BV: "NOK",
  BW: "BWP",
  BY: "BYN",
  BZ: "BZD",
  CA: "CAD",
  CC: "AUD",
  CD: "CDF",
  CF: "XAF",
  CG: "XAF",
  CH: "CHF",
  CI: "XOF",
  CK: "NZD",
  CL: "CLP",
  CM: "XAF",
  CN: "CNY",
  CO: "COP",
  CR: "CRC",
  CU: "CUP",
  CV: "CVE",
  CW: "ANG",
  CX: "AUD",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DJ: "DJF",
  DK: "DKK",
  DM: "XCD",
  DO: "DOP",
  DZ: "DZD",
  EC: "USD",
  EE: "EUR",
  EG: "EGP",
  EH: "MAD",
  ER: "ERN",
  ES: "EUR",
  ET: "ETB",
  FI: "EUR",
  FJ: "FJD",
  FK: "FKP",
  FM: "USD",
  FO: "DKK",
  FR: "EUR",
  GA: "XAF",
  GB: "GBP",
  GD: "XCD",
  GE: "GEL",
  GF: "EUR",
  GG: "GBP",
  GH: "GHS",
  GI: "GIP",
  GL: "DKK",
  GM: "GMD",
  GN: "GNF",
  GP: "EUR",
  GQ: "XAF",
  GR: "EUR",
  GS: "GBP",
  GT: "GTQ",
  GU: "USD",
  GW: "XOF",
  GY: "GYD",
  HK: "HKD",
  HM: "AUD",
  HN: "HNL",
  HR: "EUR",
  HT: "HTG",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IM: "GBP",
  IN: "INR",
  IO: "USD",
  IQ: "IQD",
  IR: "IRR",
  IS: "ISK",
  IT: "EUR",
  JE: "GBP",
  JM: "JMD",
  JO: "JOD",
  JP: "JPY",
  KE: "KES",
  KG: "KGS",
  KH: "KHR",
  KI: "AUD",
  KM: "KMF",
  KN: "XCD",
  KP: "KPW",
  KR: "KRW",
  KW: "KWD",
  KY: "KYD",
  KZ: "KZT",
  LA: "LAK",
  LB: "LBP",
  LC: "XCD",
  LI: "CHF",
  LK: "LKR",
  LR: "LRD",
  LS: "LSL",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  LY: "LYD",
  MA: "MAD",
  MC: "EUR",
  MD: "MDL",
  ME: "EUR",
  MF: "EUR",
  MG: "MGA",
  MH: "USD",
  MK: "MKD",
  ML: "XOF",
  MM: "MMK",
  MN: "MNT",
  MO: "MOP",
  MP: "USD",
  MQ: "EUR",
  MR: "MRU",
  MS: "XCD",
  MT: "EUR",
  MU: "MUR",
  MV: "MVR",
  MW: "MWK",
  MX: "MXN",
  MY: "MYR",
  MZ: "MZN",
  NA: "NAD",
  NC: "XPF",
  NE: "XOF",
  NF: "AUD",
  NG: "NGN",
  NI: "NIO",
  NL: "EUR",
  NO: "NOK",
  NP: "NPR",
  NR: "AUD",
  NU: "NZD",
  NZ: "NZD",
  OM: "OMR",
  PA: "PAB",
  PE: "PEN",
  PF: "XPF",
  PG: "PGK",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PM: "EUR",
  PN: "NZD",
  PR: "USD",
  PS: "ILS",
  PT: "EUR",
  PW: "USD",
  PY: "PYG",
  QA: "QAR",
  RE: "EUR",
  RO: "RON",
  RS: "RSD",
  RU: "RUB",
  RW: "RWF",
  SA: "SAR",
  SB: "SBD",
  SC: "SCR",
  SD: "SDG",
  SE: "SEK",
  SG: "SGD",
  SH: "SHP",
  SI: "EUR",
  SJ: "NOK",
  SK: "EUR",
  SL: "SLL",
  SM: "EUR",
  SN: "XOF",
  SO: "SOS",
  SR: "SRD",
  SS: "SSP",
  ST: "STN",
  SV: "USD",
  SX: "ANG",
  SY: "SYP",
  SZ: "SZL",
  TC: "USD",
  TD: "XAF",
  TF: "EUR",
  TG: "XOF",
  TH: "THB",
  TJ: "TJS",
  TK: "NZD",
  TL: "USD",
  TM: "TMT",
  TN: "TND",
  TO: "TOP",
  TR: "TRY",
  TT: "TTD",
  TV: "AUD",
  TW: "TWD",
  TZ: "TZS",
  UA: "UAH",
  UG: "UGX",
  UM: "USD",
  US: "USD",
  UY: "UYU",
  UZ: "UZS",
  VA: "EUR",
  VC: "XCD",
  VE: "VES",
  VG: "USD",
  VI: "USD",
  VN: "VND",
  VU: "VUV",
  WF: "XPF",
  WS: "WST",
  XK: "EUR",
  YE: "YER",
  YT: "EUR",
  ZA: "ZAR",
  ZM: "ZMW",
  ZW: "ZWL",
};

export function currencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? "USD";
}

/**
 * Extract the real client IP from request headers.
 * Checks Vercel, Cloudflare, and standard proxy headers.
 */
export async function extractClientIp(): Promise<string | null> {
  const hdrs = await headers();

  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  const realIp = hdrs.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

export interface GeoResult {
  country: string | null;
  currency: string | null;
  source?: string;
}

/**
 * Look up the country and currency for a given IP address.
 * Returns null fields on any error — registration should never fail because of geoip.
 */
export async function detectGeoFromIp(ip: string | null): Promise<GeoResult> {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    logger.info("[geoip] skipped ipinfo lookup", {
      reason: "local_or_private_ip",
      hasIp: !!ip,
    });
    return { country: null, currency: null, source: "local_or_private_ip" };
  }

  const token = process.env.IPINFO_TOKEN;
  const url = token
    ? `https://ipinfo.io/${encodeURIComponent(ip)}?token=${encodeURIComponent(
        token
      )}`
    : `https://ipinfo.io/${encodeURIComponent(ip)}/json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn("[geoip] ipinfo lookup failed", {
        status: response.status,
      });
      return { country: null, currency: null, source: "ipinfo_http_error" };
    }

    const data = (await response.json()) as { country?: string };
    const country = data.country?.toUpperCase() ?? null;
    const currency = country ? currencyForCountry(country) : null;
    logger.info("[geoip] ipinfo lookup success", {
      country,
      currency,
      hasToken: !!token,
    });
    return { country, currency, source: "ipinfo" };
  } catch {
    logger.warn("[geoip] ipinfo lookup threw error", {
      hasToken: !!token,
    });
    return { country: null, currency: null, source: "ipinfo_exception" };
  }
}

/**
 * Detect geo from the incoming Next.js request.
 * Tries Vercel's x-vercel-ip-country header first, then falls back to ipinfo.io.
 */
export async function detectGeoFromRequest(): Promise<GeoResult> {
  const hdrs = await headers();

  // Fast path: Vercel provides the country header automatically
  const vercelCountry = hdrs.get("x-vercel-ip-country");
  if (vercelCountry) {
    const country = vercelCountry.toUpperCase();
    const currency = currencyForCountry(country);
    logger.info("[geoip] resolved from vercel country header", {
      source: "vercel_header",
      country,
      currency,
    });
    return { country, currency, source: "vercel_header" };
  }

  // Fallback: ipinfo.io lookup
  const ip = await extractClientIp();
  logger.info("[geoip] falling back to ipinfo", {
    source: "ipinfo_fallback",
    hasIp: !!ip,
    hasVercelCountryHeader: false,
  });
  return detectGeoFromIp(ip);
}
