import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { analyzeCameraFrame } from "@/lib/gemini";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
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

    const analysisResult = await analyzeCameraFrame(base64Data, mimeType);

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
    return NextResponse.json(
      { error: "Failed to analyze camera frame" },
      { status: 500 }
    );
  }
}
