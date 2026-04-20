import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import LeaderboardEntry from "@/lib/models/LeaderboardEntry";
import Receipt from "@/lib/models/Receipt";
import { User } from "@/lib/models/User";
import { computeEcoScore } from "@/lib/eco-score";

/**
 * Recompute and upsert a verified leaderboard entry for an authenticated user.
 * Call this after any receipt is created or synced.
 */
export async function refreshLeaderboardEntry(userId: string) {
  await connectDB();

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [receipts, user] = await Promise.all([
    Receipt.find({ userId: userObjectId }).select("items createdAt").lean(),
    User.findById(userObjectId).select("firstName lastName geo").lean(),
  ]);

  if (receipts.length === 0) return null;

  const allItems = receipts.flatMap((r) => r.items);
  const scanDates = receipts.map((r) => new Date(r.createdAt).toISOString());

  const result = computeEcoScore({
    items: allItems,
    totalScans: receipts.length,
    scanDates,
  });

  // Generate a default nickname from the user's name
  const defaultNickname = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ""}`
    : `Eco-${userId.slice(-6)}`;

  const entry = await LeaderboardEntry.findOneAndUpdate(
    { userId: userObjectId },
    {
      $set: {
        ecoScore: result.ecoScore,
        totalScans: receipts.length,
        totalItems: result.totalItems,
        lowImpactRatio: result.lowImpactRatio,
        avgCarbonPerItem: result.avgCarbonPerItem,
        streakWeeks: result.streakWeeks,
        tier: result.tier,
        isVerified: true,
        country: user?.geo?.country,
        lastUpdated: new Date(),
      },
      $setOnInsert: {
        nickname: defaultNickname,
      },
    },
    { upsert: true, new: true }
  );

  return entry;
}
