import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import LeaderboardEntry from "@/lib/models/LeaderboardEntry";
import mongoose from "mongoose";
import { validateCommunitySubmission, getTier } from "@/lib/eco-score";
import { refreshLeaderboardEntry } from "@/lib/leaderboard";

/**
 * GET /api/v1/leaderboard — public leaderboard
 * Query params: limit (default 50, max 100), offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    await connectDB();

    const [entries, total] = await Promise.all([
      LeaderboardEntry.find()
        .sort({ ecoScore: -1, lastUpdated: 1 })
        .skip(offset)
        .limit(limit)
        .select(
          "nickname ecoScore totalScans totalItems lowImpactRatio avgCarbonPerItem streakWeeks tier isVerified country lastUpdated"
        )
        .lean(),
      LeaderboardEntry.countDocuments(),
    ]);

    // Also return the requesting user's own rank if authenticated
    let myEntry = null;
    let myRank = null;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (token) {
      const session = await decryptSession(token);
      if (session) {
        const userId = new mongoose.Types.ObjectId(session.userId);
        myEntry = await LeaderboardEntry.findOne({ userId })
          .select(
            "nickname ecoScore totalScans totalItems lowImpactRatio avgCarbonPerItem streakWeeks tier isVerified country lastUpdated"
          )
          .lean();
        if (myEntry) {
          myRank =
            (await LeaderboardEntry.countDocuments({
              ecoScore: { $gt: myEntry.ecoScore },
            })) + 1;
        }
      }
    }

    return NextResponse.json({
      entries: entries.map((e, i) => ({ ...e, rank: offset + i + 1 })),
      total,
      myEntry: myEntry ? { ...myEntry, rank: myRank } : null,
    });
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/leaderboard — update nickname or submit community score
 *
 * Authenticated users: entry is auto-created on first scan. This endpoint
 *   lets them update their nickname and triggers a score refresh.
 *   Body: { nickname: string }
 *
 * Unauthenticated users: submit client-computed score (validated for plausibility).
 *   Body: { nickname, ecoScore, totalScans, totalItems, lowImpactRatio,
 *           avgCarbonPerItem, streakWeeks }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nickname = (body.nickname || "").trim();

    if (!nickname || nickname.length > 24) {
      return NextResponse.json(
        { error: "Nickname is required and must be 24 characters or fewer" },
        { status: 400 }
      );
    }

    // Sanitize nickname: alphanumeric, spaces, hyphens, underscores only
    if (!/^[a-zA-Z0-9 _-]+$/.test(nickname)) {
      return NextResponse.json(
        {
          error:
            "Nickname can only contain letters, numbers, spaces, hyphens, and underscores",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    let session: { userId: string; email: string } | null = null;

    if (token) {
      session = await decryptSession(token);
    }

    if (session) {
      // ---- AUTHENTICATED: update nickname + refresh score ----

      // Refresh the score from receipts
      const entry = await refreshLeaderboardEntry(session.userId);

      if (!entry) {
        return NextResponse.json(
          {
            error:
              "No scans yet — scan a receipt first to join the leaderboard",
          },
          { status: 400 }
        );
      }

      // Update the nickname
      entry.nickname = nickname;
      await entry.save();

      const rank =
        (await LeaderboardEntry.countDocuments({
          ecoScore: { $gt: entry.ecoScore },
        })) + 1;

      return NextResponse.json({ entry: { ...entry.toObject(), rank } });
    } else {
      // ---- UNAUTHENTICATED: validate and accept client-computed score ----
      const {
        ecoScore,
        totalScans,
        totalItems,
        lowImpactRatio,
        avgCarbonPerItem,
        streakWeeks,
      } = body;

      if (
        ecoScore == null ||
        totalScans == null ||
        totalItems == null ||
        lowImpactRatio == null ||
        avgCarbonPerItem == null
      ) {
        return NextResponse.json(
          { error: "Missing required score fields" },
          { status: 400 }
        );
      }

      const validationError = validateCommunitySubmission({
        totalScans,
        totalItems,
        avgCarbonPerItem,
        lowImpactRatio,
        ecoScore,
      });

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // Check nickname uniqueness among unverified entries (no userId)
      const existing = await LeaderboardEntry.findOne({
        nickname: {
          $regex: new RegExp(
            `^${nickname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
        userId: { $exists: false },
      });

      if (existing) {
        // Update existing community entry with same nickname
        existing.ecoScore = ecoScore;
        existing.totalScans = totalScans;
        existing.totalItems = totalItems;
        existing.lowImpactRatio = lowImpactRatio;
        existing.avgCarbonPerItem = avgCarbonPerItem;
        existing.streakWeeks = streakWeeks || 0;
        existing.tier = getTier(ecoScore);
        existing.lastUpdated = new Date();
        await existing.save();

        const rank =
          (await LeaderboardEntry.countDocuments({
            ecoScore: { $gt: existing.ecoScore },
          })) + 1;

        return NextResponse.json({
          entry: { ...existing.toObject(), rank },
        });
      }

      const entry = await LeaderboardEntry.create({
        nickname,
        ecoScore,
        totalScans,
        totalItems,
        lowImpactRatio,
        avgCarbonPerItem,
        streakWeeks: streakWeeks || 0,
        tier: getTier(ecoScore),
        isVerified: false,
        lastUpdated: new Date(),
      });

      const rank =
        (await LeaderboardEntry.countDocuments({
          ecoScore: { $gt: entry.ecoScore },
        })) + 1;

      return NextResponse.json(
        { entry: { ...entry.toObject(), rank } },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Leaderboard POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit leaderboard entry" },
      { status: 500 }
    );
  }
}
