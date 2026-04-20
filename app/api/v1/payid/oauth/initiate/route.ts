import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { User } from "@/lib/models/User";
import { OAuthSession } from "@/lib/models/OAuthSession";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "@/lib/crypto";

const PAYID_BASE_URL = process.env.PAYID_API_URL!;
const CLIENT_ID = process.env.OAUTH_CLIENT_ID!;
const REDIRECT_URI = process.env.REDIRECT_URL!;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader =
      request.headers.get("authorization") || request.headers.get("auth-token");
    let authToken = null;
    if (authHeader?.startsWith("Bearer ")) {
      authToken = authHeader.substring(7);
    } else if (authHeader) {
      authToken = authHeader;
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const rawState = generateState();

    // Encode user token into state
    const stateObject = {
      csrf: rawState,
      token: authToken || null,
    };
    const state = Buffer.from(JSON.stringify(stateObject)).toString(
      "base64url",
    );

    // Store session in database (userId optional)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Parse optional referral code and returnUrl from body
    let referrerId: string | null = null;
    let returnUrl: string | null = null;
    try {
      const body = await request.clone().json();
      console.log("INITIATE ROUTE PARSED BODY:", body);
      if (body.returnUrl) {
        returnUrl = body.returnUrl;
      }
      if (body.ref) {
        // Resolve payTag to Object ID
        const referrer = await User.findOne({ payTag: body.ref }).lean<{
          _id: string;
        }>();
        if (referrer) {
          console.log(
            "INITIATE ROUTE FOUND REFERRER:",
            referrer._id.toString(),
          );
          referrerId = referrer._id.toString();
        } else {
          console.log("INITIATE ROUTE FAILED TO FIND REFERRER:", body.ref);
        }
      }
    } catch (e) {
      console.log("INITIATE ROUTE BODY PARSE ERROR:", e);
      // Body might be empty, that's fine
    }

    if (!referrerId) {
      // Snag any pending referrals before browser bounces cross-site
      const cookieStore = await cookies();
      referrerId = cookieStore.get("bucket-referral")?.value || null;
    }

    await OAuthSession.create({
      state,
      codeVerifier,
      userId: null,
      referralId: referrerId,
      returnUrl: returnUrl,
      csrf: rawState,
      expiresAt,
    });

    // Build authorization URL
    const authUrl = new URL(`${PAYID_BASE_URL}/oauth/authorize`);
    authUrl.searchParams.set("client_id", CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", "openid profile email kyc:read");

    return NextResponse.json({
      success: true,
      message: "OAuth authorization URL generated",
      data: {
        authorizationUrl: authUrl.toString(),
      },
    });
  } catch (error) {
    console.error("OAuth initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to initiate OAuth",
        },
      },
      { status: 500 },
    );
  }
}
