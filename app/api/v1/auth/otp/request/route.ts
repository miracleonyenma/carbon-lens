import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { VerificationToken } from "@/lib/models/VerificationToken";
import { EmailService } from "@/utils/email";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, shouldCreate } = await req.json();

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

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Use the real Email Service wrapper for standard delivery mode (Resend by Default)
    const emailService = new EmailService();

    const htmlBody = emailService.generateStandardTemplate({
      title: "Your Verification Code",
      content: `<p>Hello,</p><p>Please use the following 6-digit code to verify your Bucket account.</p><h2 style="font-size: 32px; letter-spacing: 4px; color: #1a74e4; text-align: center; margin: 30px 0;">${otp}</h2><p>This code will expire in 15 minutes.</p>`,
    });

    const emailResponse = await emailService.sendEmail({
      to: { email: normalizedEmail },
      subject: "Your Bucket Verification Code",
      htmlBody,
    });

    if (!emailResponse.success) {
      throw new Error("Failed to dispatch OTP email: " + emailResponse.error);
    }

    // Hash the OTP before saving to DB
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Expire any existing OTPs for this email to prevent spam/confusion
    await VerificationToken.deleteMany({
      identifier: normalizedEmail,
      type: "OTP",
    });

    // Save the new hashed OTP to the database, valid for 15 minutes
    await VerificationToken.create({
      identifier: normalizedEmail,
      token: hashedOtp,
      type: "OTP",
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    });

    return NextResponse.json({
      success: true,
      message: "An OTP has been sent to your email address",
    });
  } catch (error) {
    console.error("OTP Request error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
