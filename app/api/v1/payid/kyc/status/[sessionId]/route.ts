import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { checkKYCStatus } from "@/lib/payid";

export async function GET(
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

    // Check status with PayID
    const result = await checkKYCStatus(accessToken, sessionId);

    // Update user data if this is their session
    if (user.kycData?.payidKyc?.sessionId === sessionId) {
      user.kycData.payidKyc.kycVerified = result.status === "verified";
      user.kycData.payidKyc.verificationLevel = result.verificationLevel;
      user.kycData.payidKyc.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Verification status retrieved",
      data: {
        sessionId,
        kycStatus: result.status,
        verificationLevel: result.verificationLevel,
        provider: result.provider,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Check session status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to check status",
        },
      },
      { status: 500 },
    );
  }
}
