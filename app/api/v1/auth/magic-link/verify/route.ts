import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { VerificationToken } from "@/lib/models/VerificationToken";
import bcrypt from "bcryptjs";
import { encryptSession } from "@/lib/session";
import { applyReferralCookie } from "@/lib/referrals";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");
    const returnUrl = url.searchParams.get("returnUrl") || "/dashboard";

    if (!email || !token) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Missing+magic+link+parameters", req.url),
      );
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase();

    // Find the non-expired Magic Link record
    const tokenRecord = await VerificationToken.findOne({
      identifier: normalizedEmail,
      type: "MAGIC_LINK",
      expires: { $gt: new Date() }, // Ensure we only get non-expired tokens
    });

    if (!tokenRecord) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Magic+link+expired+or+invalid", req.url),
      );
    }

    // Verify the hashed token
    const isMatch = await bcrypt.compare(token, tokenRecord.token);

    if (!isMatch) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Invalid+magic+link", req.url),
      );
    }

    // Valid Token - clean it up so it can't be reused
    await VerificationToken.deleteOne({ _id: tokenRecord._id });

    // Look up user, or create one if they were registering
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // User is registering via Magic Link
      user = await User.create({
        email: normalizedEmail,
        emailVerified: true, // We know they own the email since they clicked the link
      });
    } else if (!user.emailVerified) {
      // Email was unverified
      user.emailVerified = true;
      await user.save();
    }

    // Generate JWT session
    const sessionToken = await encryptSession({
      userId: user._id.toString(),
      email: user.email,
      roles: ["user"],
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Fire & Forget: bind any active referral cookie payload
    applyReferralCookie(user._id.toString());

    return NextResponse.redirect(new URL(returnUrl, req.url));
  } catch (error) {
    console.error("Magic Link Verify error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?message=Internal+server+error", req.url),
    );
  }
}
