import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { analyzeImage, analyzeText, GeminiError } from "@/lib/gemini";
import { buildAnalysisContext, getClimateContext } from "@/lib/climate";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/lib/models/Receipt";
import { User } from "@/lib/models/User";
import { detectGeoFromRequest } from "@/utils/geoip";

let scanRequestCount = 0;

export async function POST(request: NextRequest) {
  scanRequestCount++;
  const reqId = scanRequestCount;
  const ts = new Date().toISOString();
  console.log(`[SCAN #${reqId}] ${ts} — incoming POST /api/v1/receipts/scan`);
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    let session: { userId: string } | null = null;
    if (token) {
      session = await decryptSession(token);
    }

    const contentType = request.headers.get("content-type") || "";
    const userApiKey = request.headers.get("x-gemini-key") || undefined;
    await connectDB();

    const [climate, user, geo] = await Promise.all([
      getClimateContext(),
      session
        ? User.findById(session.userId).select("geo").lean()
        : Promise.resolve(null),
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

    let analysisResult;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("receipt") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No receipt file provided" },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
          },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      analysisResult = await analyzeImage(
        base64,
        file.type,
        userApiKey,
        promptContext
      );
    } else {
      const body = await request.json();
      const { items } = body;

      if (!items || typeof items !== "string" || items.trim().length === 0) {
        return NextResponse.json(
          { error: "Please provide a list of items" },
          { status: 400 }
        );
      }

      // Limit input length
      if (items.length > 5000) {
        return NextResponse.json(
          { error: "Input too long. Maximum 5000 characters." },
          { status: 400 }
        );
      }

      analysisResult = await analyzeText(items, userApiKey, promptContext);
    }
    // Only persist to DB if authenticated
    if (session) {
      const receipt = await Receipt.create({
        userId: session.userId,
        ...analysisResult,
      });

      return NextResponse.json({
        success: true,
        receipt: {
          id: receipt._id,
          storeName: receipt.storeName,
          receiptDate: receipt.receiptDate,
          items: receipt.items,
          totalCarbonKg: receipt.totalCarbonKg,
          totalItems: receipt.totalItems,
          insights: receipt.insights,
          createdAt: receipt.createdAt,
        },
      });
    }

    // Anonymous — return analysis without saving
    return NextResponse.json({
      success: true,
      anonymous: true,
      receipt: {
        id: null,
        ...analysisResult,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[SCAN #${reqId}] Error:`, errMsg, error);
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
    return NextResponse.json(
      { error: "Failed to analyze. Please try again." },
      { status: 500 }
    );
  }
}
