import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { analyzeReceiptImage, analyzeReceiptText } from "@/lib/gemini";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/lib/models/Receipt";

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

    const contentType = request.headers.get("content-type") || "";

    let analysisResult;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("receipt") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No receipt file provided" },
          { status: 400 },
        );
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
          { status: 400 },
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      analysisResult = await analyzeReceiptImage(base64, file.type);
    } else {
      const body = await request.json();
      const { items } = body;

      if (!items || typeof items !== "string" || items.trim().length === 0) {
        return NextResponse.json(
          { error: "Please provide a list of items" },
          { status: 400 },
        );
      }

      // Limit input length
      if (items.length > 5000) {
        return NextResponse.json(
          { error: "Input too long. Maximum 5000 characters." },
          { status: 400 },
        );
      }

      analysisResult = await analyzeReceiptText(items);
    }

    await connectDB();

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
  } catch (error) {
    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { error: "Failed to analyze receipt. Please try again." },
      { status: 500 },
    );
  }
}
