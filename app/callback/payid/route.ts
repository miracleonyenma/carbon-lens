import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OAuthSession } from "@/lib/models/OAuthSession";
import { User } from "@/lib/models/User";
import { exchangeCodeForTokens, getUserInfo } from "@/lib/payid";
import { encryptToken } from "@/lib/crypto";
import { encryptSession } from "@/lib/session";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    console.log("🔍 Inspecting PayID Callback: ", {
      searchParams,
      code,
      state,
    });

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/auth/error?message=Missing authorization code or state",
          request.url,
        ),
      );
    }

    // Retrieve session data
    const session = await OAuthSession.findOne({ state });

    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Invalid or expired session", request.url),
      );
    }

    // Validate CSRF
    const stateObject = JSON.parse(Buffer.from(state, "base64url").toString());
    if (stateObject.csrf !== session.csrf) {
      await OAuthSession.deleteOne({ _id: session._id });
      return NextResponse.redirect(
        new URL("/auth/error?message=CSRF validation failed", request.url),
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, session.codeVerifier);

    // Fetch user info
    const userInfo = await getUserInfo(encryptToken(tokens.access_token));

    // Find or create user
    let user = null;

    // 1. KYC Flow: If the user was already logged in, their token is in stateObject
    if (stateObject.token) {
      // TODO: In production, cryptographically verify stateObject.token
      // to extract the exact userId. For now, we continue finding by email
      // as a fallback, but the token is present to prove an authenticated session.
    }

    // 2. Fallback / Login Flow: Look up by email if no token user was found
    if (!user) {
      user = await User.findOne({ email: userInfo.email });
    }

    if (!user) {
      // 3. Register Flow: Create new user
      user = await User.create({
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        picture: userInfo.picture,
        payTag: userInfo.pay_tag,
        emailVerified: userInfo.email_verified,
        phone: userInfo.phone,
        phoneVerified: userInfo.phone_verified,
      });
    } else {
      // Update user info from PayID
      user.firstName = userInfo.given_name || user.firstName;
      user.lastName = userInfo.family_name || user.lastName;
      user.picture = userInfo.picture || user.picture;
      user.payTag = userInfo.pay_tag;
      user.emailVerified = userInfo.email_verified;
      user.phone = userInfo.phone || user.phone;
      user.phoneVerified = userInfo.phone_verified || user.phoneVerified;
    }

    // Update user with PayID data
    user.kycData = {
      payidKyc: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        idToken: encryptToken(tokens.id_token),
        payidSub: userInfo.sub,
        payTag: userInfo.pay_tag,
        kycVerified: userInfo.kyc_verified || false,
        verificationLevel: userInfo.verification_level || null,
        updatedAt: new Date(),
      },
    };

    // Safely attach any referral payload tracked through the cross-site OAuth bounce
    console.log("PAYID CALLBACK: Checking Referral ID ->", session.referralId);
    console.log("PAYID CALLBACK: Current User Referred By ->", user.referredBy);

    if (
      session.referralId &&
      !user.referredBy &&
      user._id.toString() !== session.referralId
    ) {
      console.log("PAYID CALLBACK: Binding Referral ID to User!");
      user.referredBy = new mongoose.Types.ObjectId(session.referralId);
    } else {
      console.log("PAYID CALLBACK: Evaluating false for Referral Binding:", {
        sessionRefId: session.referralId,
        userRefBy: user.referredBy,
        userIdMatch: user._id.toString() === session.referralId,
      });
    }

    await user.save();
    console.log("PAYID CALLBACK: User successfully saved.");

    // Clear session
    await OAuthSession.deleteOne({ _id: session._id });

    // Generate a secure JWT auth cookie to log the user in
    const finalRedirectUrl =
      session.returnUrl && session.returnUrl.startsWith("/")
        ? session.returnUrl
        : "/dashboard";
    const response = NextResponse.redirect(
      new URL(finalRedirectUrl, request.url),
    );

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      roles: ["user"],
    };

    // Produce a cryptographically signed JWT
    const sessionToken = await encryptSession(sessionPayload);

    response.cookies.set({
      name: "auth-token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 1 week
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(error instanceof Error ? error.message : "OAuth callback failed")}`,
        request.url,
      ),
    );
  }
}
