import { User } from "@/lib/models/User";
import { detectGeoFromRequest, type GeoResult } from "@/utils/geoip";

type UserGeoShape = {
  _id: string | { toString(): string };
  geo?: {
    country?: string | null;
    currency?: string | null;
    source?: string | null;
  } | null;
};

export async function backfillUserGeoIfMissing(
  user: UserGeoShape | null | undefined
): Promise<GeoResult | null> {
  if (!user || user.geo?.country) {
    return user?.geo?.country
      ? {
          country: user.geo.country,
          currency: user.geo.currency ?? null,
          source: user.geo.source ?? "user_profile",
        }
      : null;
  }

  const detectedGeo = await detectGeoFromRequest();
  if (!detectedGeo.country) return null;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        geo: {
          country: detectedGeo.country,
          currency: detectedGeo.currency,
          source: detectedGeo.source,
          detectedAt: new Date(),
        },
      },
    }
  );

  return detectedGeo;
}
