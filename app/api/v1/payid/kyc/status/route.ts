import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { checkKYCStatus } from "@/lib/payid";

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
    const isConnected = !!accessToken;
    const hasSession = !!user.kycData?.payidKyc?.sessionId;

    if (!isConnected) {
      return NextResponse.json({
        success: true,
        message: "Current verification status retrieved",
        data: {
          hasSession: false,
          isConnected: false,
          kycVerified: false,
        },
      });
    }

    if (!hasSession) {
      return NextResponse.json({
        success: true,
        message: "Current verification status retrieved",
        data: {
          hasSession: false,
          isConnected: true,
          kycVerified: user.kycData?.payidKyc?.kycVerified || false,
          verificationLevel: user.kycData?.payidKyc?.verificationLevel || null,
        },
      });
    }

    // Check status with PayID
    const result = await checkKYCStatus(accessToken);

    // Update user data
    if (user.kycData?.payidKyc) {
      user.kycData.payidKyc.kycVerified = result.status === "verified";
      user.kycData.payidKyc.verificationLevel = result.verificationLevel;
      user.kycData.payidKyc.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Current verification status retrieved",
      data: {
        hasSession: true,
        isConnected: true,
        sessionId: user.kycData?.payidKyc?.sessionId,
        kycStatus: result.status,
        kycVerified: result.status === "verified",
        verificationLevel: result.verificationLevel,
        provider: user.kycData?.payidKyc?.provider,
        shareableUrl: result.shareableUrl || null,
        updatedAt: user.kycData?.payidKyc?.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to get KYC status",
        },
      },
      { status: 500 },
    );
  }
}
