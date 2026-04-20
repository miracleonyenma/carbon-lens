import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getUserInfo } from "@/lib/payid";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authToken = request.headers.get("auth-token");
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: { message: "Authentication required" } },
        { status: 401 },
      );
    }

    // TODO: Get userId from auth token
    const userId = "user_placeholder";

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 },
      );
    }

    const accessToken = user.kycData?.payidKyc?.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: { message: "PayID not connected" } },
        { status: 400 },
      );
    }

    const userInfo = await getUserInfo(accessToken);

    return NextResponse.json({
      success: true,
      message: "User information retrieved successfully",
      data: {
        payidSub: userInfo.sub,
        payTag: userInfo.pay_tag,
        email: userInfo.email,
        emailVerified: userInfo.email_verified,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        picture: userInfo.picture,
        phone: userInfo.phone,
        phoneVerified: userInfo.phone_verified,
        kycVerified: userInfo.kyc_verified || false,
        verificationLevel: userInfo.verification_level || null,
      },
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to get user info",
        },
      },
      { status: 500 },
    );
  }
}
