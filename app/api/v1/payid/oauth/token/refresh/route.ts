import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { refreshAccessToken } from "@/lib/payid";
import { encryptToken } from "@/lib/crypto";

export async function POST(request: NextRequest) {
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

    const storedRefreshToken = user.kycData?.payidKyc?.refreshToken;
    if (!storedRefreshToken) {
      return NextResponse.json(
        { success: false, error: { message: "No refresh token found" } },
        { status: 400 },
      );
    }

    // Refresh tokens
    const tokens = await refreshAccessToken(storedRefreshToken);

    // Update stored tokens
    if (user.kycData?.payidKyc) {
      user.kycData.payidKyc.accessToken = encryptToken(tokens.access_token);
      user.kycData.payidKyc.refreshToken = encryptToken(
        tokens.refresh_token || storedRefreshToken,
      );
      user.kycData.payidKyc.idToken = encryptToken(tokens.id_token);
      user.kycData.payidKyc.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Access token refreshed successfully",
      data: { success: true },
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    // Clear invalid tokens
    try {
      const authToken = request.headers.get("auth-token");
      if (authToken) {
        const userId = "user_placeholder"; // TODO: Get from auth
        const user = await User.findById(userId);
        if (user?.kycData?.payidKyc) {
          user.kycData.payidKyc.accessToken = undefined;
          user.kycData.payidKyc.refreshToken = undefined;
          await user.save();
        }
      }
    } catch (cleanupError) {
      console.error("Token cleanup error:", cleanupError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Token refresh failed",
        },
      },
      { status: 401 },
    );
  }
}
