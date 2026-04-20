import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { initiateKYCVerification, type KYCVerifyRequest } from "@/lib/payid";

const PAYID_ORG_ID = process.env.ORG_ID!;

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

    const accessToken = user.kycData?.payidKyc?.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Please connect your PayID account first" },
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      country,
      address,
      identityNumbers,
      gender,
    } = body;

    // Determine provider based on country
    const provider = country.toUpperCase() === "NG" ? "qoreid" : "plaid";

    // Format date to YYYY-MM-DD
    const formattedDate = new Date(dateOfBirth).toISOString().split("T")[0];

    // Build request based on provider
    const requestData: Partial<KYCVerifyRequest> = {
      organizationId: PAYID_ORG_ID,
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      dateOfBirth: formattedDate,
      provider,
    };

    if (provider === "qoreid") {
      // QoreID format
      requestData.documentType = identityNumbers.NIN ? "nin" : "bvn";
      requestData.documentNumber = identityNumbers.NIN || identityNumbers.BVN;
      if (gender) {
        requestData.gender = gender;
      }
    } else {
      // Plaid format
      requestData.gaveConsent = true;
      requestData.address = {
        street: address.street,
        street2: address.street2 || "",
        city: address.city,
        region: address.state,
        postal_code: address.postalCode,
        country: address.country,
      };

      // Handle both legacy SSN and new idNumber format
      if (identityNumbers.idNumber && identityNumbers.idNumberType) {
        requestData.idNumber = identityNumbers.idNumber;
        requestData.idNumberType = identityNumbers.idNumberType;
      } else if (identityNumbers.SSN) {
        requestData.idNumber = identityNumbers.SSN;
        requestData.idNumberType = "us_ssn";
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              message:
                "idNumber with idNumberType or SSN is required for Plaid",
            },
          },
          { status: 400 },
        );
      }
    }

    // Call PayID API
    const result = await initiateKYCVerification(
      accessToken,
      requestData as KYCVerifyRequest,
    );

    // Update user with session info
    if (user.kycData?.payidKyc) {
      user.kycData.payidKyc.sessionId = result.sessionId;
      user.kycData.payidKyc.provider = result.provider;
      user.kycData.payidKyc.kycVerified = result.status === "verified";
      user.kycData.payidKyc.verificationLevel = result.verificationLevel;
      user.kycData.payidKyc.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "KYC verification initiated",
      data: {
        sessionId: result.sessionId,
        provider: result.provider,
        kycStatus: result.status,
        verificationLevel: result.verificationLevel,
        shareableUrl: result.shareableUrl || null,
        kycVerified: result.status === "verified",
        message: result.shareableUrl
          ? "Please complete verification at the provided URL"
          : "Verification completed successfully",
      },
    });
  } catch (error) {
    console.error("KYC verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "KYC verification failed",
        },
      },
      { status: 500 },
    );
  }
}
