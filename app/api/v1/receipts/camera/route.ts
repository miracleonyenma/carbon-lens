import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { buildAnalysisContext, getClimateContext } from "@/lib/climate";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { analyzeCameraFrame, GeminiError } from "@/lib/gemini";
import { detectGeoFromRequest } from "@/utils/geoip";

// Allow larger body for base64 camera frames
export const maxDuration = 30;

let cameraRequestCount = 0;

export async function POST(request: NextRequest) {
  cameraRequestCount++;
  const reqId = cameraRequestCount;
  const ts = new Date().toISOString();
  console.log(
    `[CAMERA #${reqId}] ${ts} — incoming POST /api/v1/receipts/camera`
  );
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await decryptSession(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // BYOK: check for user-provided API key
    const userApiKey = request.headers.get("x-gemini-key") || undefined;
    await connectDB();

    const [climate, user, geo] = await Promise.all([
      getClimateContext(),
      User.findById(session.userId).select("geo").lean(),
      detectGeoFromRequest(),
    ]);

    const preferredGeo = user?.geo?.country
      ? {
          country: user.geo.country,
          currency: user.geo.currency ?? null,
          source: user.geo.source ?? "user_profile",
        }
      : geo;

    const promptContext = buildAnalysisContext(climate, preferredGeo);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body — frame may be too large" },
        { status: 400 }
      );
    }

    const { frame, mimeType } = body;

    if (!frame || typeof frame !== "string") {
      return NextResponse.json(
        { error: "No camera frame provided" },
        { status: 400 }
      );
    }

    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        { error: "No mime type provided" },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = frame.includes(",") ? frame.split(",")[1] : frame;

    const analysisResult = await analyzeCameraFrame(
      base64Data,
      mimeType,
      userApiKey,
      promptContext
    );

    return NextResponse.json({
      success: true,
      result: {
        items: analysisResult.items,
        totalCarbonKg: analysisResult.totalCarbonKg,
        totalItems: analysisResult.totalItems,
        insights: analysisResult.insights,
      },
    });
  } catch (error) {
    console.error("Camera analysis error:", error);
    if (error instanceof GeminiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryAfter: error.retryAfter,
        },
        { status: error.code === "RATE_LIMIT" ? 429 : 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to analyze camera frame";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
