import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

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
    const user = await User.findById(session.userId)
      .select(
        "-kycData.payidKyc.accessToken -kycData.payidKyc.refreshToken -kycData.payidKyc.idToken",
      )
      .populate("referredBy", "payTag")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        payTag: user.payTag,
        referredBy: user.referredBy?.payTag || undefined,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        kycVerified: user.kycData?.payidKyc?.kycVerified,
      },
    });
  } catch (error) {
    console.error("Fetch session error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
