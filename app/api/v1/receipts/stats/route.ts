import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/lib/models/Receipt";
import mongoose from "mongoose";

export async function GET() {
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

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.userId);

    // Overall stats
    const [overallStats] = await Receipt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          totalCarbonKg: { $sum: "$totalCarbonKg" },
          totalItems: { $sum: "$totalItems" },
          avgCarbonPerReceipt: { $avg: "$totalCarbonKg" },
        },
      },
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Receipt.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalCarbonKg: { $sum: "$totalCarbonKg" },
          scans: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Receipt.aggregate([
      { $match: { userId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.category",
          totalCarbonKg: { $sum: "$items.carbonKg" },
          itemCount: { $sum: 1 },
        },
      },
      { $sort: { totalCarbonKg: -1 } },
    ]);

    // Impact distribution
    const impactDistribution = await Receipt.aggregate([
      { $match: { userId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.impactLevel",
          count: { $sum: 1 },
          totalCarbonKg: { $sum: "$items.carbonKg" },
        },
      },
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return NextResponse.json({
      overview: {
        totalScans: overallStats?.totalScans || 0,
        totalCarbonKg: Math.round((overallStats?.totalCarbonKg || 0) * 100) / 100,
        totalItems: overallStats?.totalItems || 0,
        avgCarbonPerReceipt:
          Math.round((overallStats?.avgCarbonPerReceipt || 0) * 100) / 100,
      },
      monthlyTrend: monthlyTrend.map((m) => ({
        month: `${months[m._id.month - 1]} ${m._id.year}`,
        totalCarbonKg: Math.round(m.totalCarbonKg * 100) / 100,
        scans: m.scans,
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        totalCarbonKg: Math.round(c.totalCarbonKg * 100) / 100,
        itemCount: c.itemCount,
      })),
      impactDistribution: impactDistribution.map((i) => ({
        level: i._id,
        count: i.count,
        totalCarbonKg: Math.round(i.totalCarbonKg * 100) / 100,
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
