import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

/**
 * Handle POST - Submit retroactive referral code if empty
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    const session = await decryptSession(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 },
      );
    }

    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: "Referral code is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const currentUser = await User.findById(session.userId);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (currentUser.referredBy) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already been referred by someone",
        },
        { status: 400 },
      );
    }

    // Never let users refer themselves
    if (currentUser.payTag === referralCode) {
      return NextResponse.json(
        { success: false, message: "You cannot refer yourself" },
        { status: 400 },
      );
    }

    const referringUser = await User.findOne({ payTag: referralCode });

    if (!referringUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid referral code. This PayTag does not exist.",
        },
        { status: 404 },
      );
    }

    currentUser.referredBy = referringUser._id;
    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: "Referral code successfully applied",
      data: {
        referredBy: referringUser.payTag,
      },
    });
  } catch (error) {
    console.error("Referral POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Handle GET - Fetch list of users that I have referred
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 },
      );
    }

    const session = await decryptSession(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 },
      );
    }

    await connectDB();

    const referredUsers = await User.find({ referredBy: session.userId })
      .select("firstName lastName email payTag createdAt picture")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: referredUsers,
    });
  } catch (error) {
    console.error("Referral GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
