import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { VerificationToken } from "@/lib/models/VerificationToken";
import bcrypt from "bcryptjs";
import { encryptSession } from "@/lib/session";
import { applyReferralCookie } from "@/lib/referrals";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, otp, returnUrl } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase();

    // Find the non-expired OTP record
    const tokenRecord = await VerificationToken.findOne({
      identifier: normalizedEmail,
      type: "OTP",
      expires: { $gt: new Date() }, // Ensure we only get non-expired tokens
    });

    if (!tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired or is invalid. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // Verify the hashed OTP
    const isMatch = await bcrypt.compare(otp, tokenRecord.token);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code" },
        { status: 400 },
      );
    }

    // Valid OTP - clean it up so it can't be reused
    await VerificationToken.deleteOne({ _id: tokenRecord._id });

    // Look up user, or create one if they were registering
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // User is registering via OTP
      user = await User.create({
        email: normalizedEmail,
        emailVerified: true, // We know they own the email since they verified the OTP
      });
    } else if (!user.emailVerified) {
      // Email was unverified (from standard password registration)
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

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      redirectUrl: returnUrl || "/dashboard",
    });
  } catch (error) {
    console.error("OTP Verify error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
