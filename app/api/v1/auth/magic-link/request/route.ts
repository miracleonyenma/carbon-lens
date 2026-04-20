import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { VerificationToken } from "@/lib/models/VerificationToken";
import { EmailService } from "@/utils/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, shouldCreate, returnUrl } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });

    // If no user exists and creation is disallowed by the client configuration: reject.
    if (!user && !shouldCreate) {
      return NextResponse.json(
        { success: false, message: "No account found with this email" },
        { status: 404 },
      );
    }

    // Generate a secure 32 byte hex token
    const token = crypto.randomBytes(32).toString("hex");

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const params = new URLSearchParams({
      token,
      email: normalizedEmail,
      ...(returnUrl && { returnUrl }),
    });

    const magicLinkUrl = `${protocol}://${host}/api/v1/auth/magic-link/verify?${params.toString()}`;

    // Send the Magic Link via Email Service wrapper (Resend By Default)
    const emailService = new EmailService();

    const htmlBody = emailService.generateStandardTemplate({
      title: "Sign in to Bucket",
      content: `<p>Hello,</p><p>We received a request to sign in to your Bucket account.</p><p>Click the button below to securely authenticate your session.</p>`,
      buttonText: "Sign in securely",
      buttonUrl: magicLinkUrl,
    });

    const emailResponse = await emailService.sendEmail({
      to: { email: normalizedEmail },
      subject: "Sign in to Bucket",
      htmlBody,
    });

    if (!emailResponse.success) {
      throw new Error(
        "Failed to dispatch Magic Link email: " + emailResponse.error,
      );
    }

    // Hash the token before saving it to the database
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(token, salt);

    // Expire any existing magic links for this email to prevent spam/confusion
    await VerificationToken.deleteMany({
      identifier: normalizedEmail,
      type: "MAGIC_LINK",
    });

    // Save the new hashed token to the database, valid for 1 hour
    await VerificationToken.create({
      identifier: normalizedEmail,
      token: hashedToken,
      type: "MAGIC_LINK",
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    });

    return NextResponse.json({
      success: true,
      message: "A magic link has been sent to your email address",
    });
  } catch (error) {
    console.error("Magic Link Request error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
