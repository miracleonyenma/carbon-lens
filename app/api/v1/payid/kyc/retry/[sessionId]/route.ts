import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { retryKYCVerification } from "@/lib/payid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    await connectDB();

    const { sessionId } = await params;

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

    // Retry verification
    const result = await retryKYCVerification(accessToken, sessionId);

    // Update user data
    if (user.kycData?.payidKyc) {
      user.kycData.payidKyc.kycVerified = result.status === "verified";
      user.kycData.payidKyc.verificationLevel = result.verificationLevel;
      user.kycData.payidKyc.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Verification retry initiated",
      data: {
        sessionId: result.sessionId,
        provider: result.provider,
        kycStatus: result.status,
        shareableUrl: result.shareableUrl || null,
        message: result.shareableUrl
          ? "Please complete verification at the provided URL"
          : "Verification completed successfully",
      },
    });
  } catch (error) {
    console.error("KYC retry error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "KYC retry failed",
        },
      },
      { status: 500 },
    );
  }
}
