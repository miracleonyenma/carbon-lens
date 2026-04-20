import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OAuthSession } from "@/lib/models/OAuthSession";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "@/lib/crypto";

const PAYID_BASE_URL = process.env.PAYID_API_URL!;
const CLIENT_ID = process.env.OAUTH_CLIENT_ID!;
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, shouldCreate, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const authHeader =
      request.headers.get("authorization") || request.headers.get("auth-token");
    let authToken = null;
    if (authHeader?.startsWith("Bearer ")) {
      authToken = authHeader.substring(7);
    } else if (authHeader) {
      authToken = authHeader;
    } else {
      // Also check cookies
      authToken = request.cookies.get("auth-token")?.value || null;
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const rawState = generateState();

    // Encode user token into state so the callback knows who initiated this
    const stateObject = {
      csrf: rawState,
      token: authToken || null,
    };
    const state = Buffer.from(JSON.stringify(stateObject)).toString(
      "base64url",
    );

    // Store session in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await OAuthSession.create({
      state,
      codeVerifier,
      userId: null,
      csrf: rawState,
      expiresAt,
    });

    // Build the authorization URL to act as the return_url for PayID
    const authUrl = new URL(`${PAYID_BASE_URL}/oauth/authorize`);
    authUrl.searchParams.set("client_id", CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", "openid profile email kyc:read");

    // Call the external PayID Magic Link API
    const payidResponse = await fetch(
      `${PAYID_BASE_URL}/oauth/login/magic-link/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OAUTH_CLIENT_SECRET}`, // Use client secret or API key if required by PayID, though magic link request might be public/client-based. Let's assume it needs client credentials or is public. Wait, the docs say POST /oauth/login/magic-link/request. We'll pass standard headers.
        },
        body: JSON.stringify({
          email,
          shouldCreate,
          firstName,
          lastName,
          return_url: authUrl.toString(),
        }),
      },
    );

    if (!payidResponse.ok) {
      const errorData = await payidResponse.json().catch(() => null);
      console.error(
        "PayID magic link request failed:",
        payidResponse.status,
        errorData,
      );
      throw new Error(
        errorData?.message || "Failed to dispatch PayID magic link",
      );
    }

    const data = await payidResponse.json();

    return NextResponse.json({
      success: true,
      message: "PayID magic link dispatched successfully",
      data,
    });
  } catch (error) {
    console.error("PayID Magic Link Initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
