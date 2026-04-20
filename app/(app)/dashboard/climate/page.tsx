"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClimateContext } from "@/components/carbon/climate-context";
import { useAuth } from "@/components/providers/auth-provider";
import type { ClimateContext as ClimateContextData } from "@/lib/climate";

export default function ClimateStatsPage() {
  const { user } = useAuth();
  const [climate, setClimate] = useState<ClimateContextData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/system/climate")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setClimate(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="grid gap-4 xl:grid-cols-3">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`h-48 rounded-xl bg-muted ${
                  i === 0 ? "xl:col-span-3" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      {climate ? (
        <ClimateContext
          climate={climate}
          regionContext={{
            country: user?.geoCountry,
            currency: user?.geoCurrency,
            source: user?.geoSource,
          }}
        />
      ) : (
        <p className="text-muted-foreground">
          Climate data is unavailable right now.
        </p>
      )}
    </div>
  );
}
