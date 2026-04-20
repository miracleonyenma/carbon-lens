import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
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

    const body = await request.json();
    const { receipts } = body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return NextResponse.json(
        { error: "No receipts to sync" },
        { status: 400 }
      );
    }

    // Cap at 50 receipts per sync to prevent abuse
    if (receipts.length > 50) {
      return NextResponse.json(
        { error: "Too many receipts. Maximum 50 per sync." },
        { status: 400 }
      );
    }

    await connectDB();

    const docs = receipts.map(
      (r: {
        localId: string;
        storeName?: string;
        receiptDate?: string;
        items: unknown[];
        totalCarbonKg: number;
        totalItems: number;
        insights?: string;
        createdAt: string;
      }) => ({
        userId: session.userId,
        storeName: r.storeName,
        receiptDate: r.receiptDate ? new Date(r.receiptDate) : undefined,
        items: r.items,
        totalCarbonKg: r.totalCarbonKg,
        totalItems: r.totalItems,
        insights: r.insights,
        createdAt: new Date(r.createdAt),
      })
    );

    await Receipt.insertMany(docs);

    const syncedLocalIds = receipts.map((r: { localId: string }) => r.localId);

    return NextResponse.json({
      success: true,
      syncedCount: docs.length,
      syncedLocalIds,
    });
  } catch (error) {
    console.error("Receipt sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync receipts" },
      { status: 500 }
    );
  }
}
