import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/lib/models/Receipt";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const skip = (page - 1) * limit;

    await connectDB();

    const [receipts, total] = await Promise.all([
      Receipt.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments({ userId: session.userId }),
    ]);

    return NextResponse.json({
      receipts: receipts.map((r) => ({
        id: r._id,
        storeName: r.storeName,
        receiptDate: r.receiptDate,
        totalCarbonKg: r.totalCarbonKg,
        totalItems: r.totalItems,
        items: r.items,
        insights: r.insights,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Receipt list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}
