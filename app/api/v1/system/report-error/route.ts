import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { EmailService } from "@/utils/email";

// Set to high so this endpoint isn't easily manipulated
const RATE_LIMIT_POINTS = 5;
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();

    // Simple IP-based in-memory rate limiter to prevent spamming admin inboxes
    const currentLimit = rateLimits.get(ip) || {
      count: 0,
      expiresAt: now + RATE_LIMIT_DURATION,
    };
    if (now > currentLimit.expiresAt) {
      currentLimit.count = 0;
      currentLimit.expiresAt = now + RATE_LIMIT_DURATION;
    }
    currentLimit.count++;
    rateLimits.set(ip, currentLimit);

    if (currentLimit.count > RATE_LIMIT_POINTS) {
      return NextResponse.json(
        { success: false, message: "Too many error reports sent" },
        { status: 429 },
      );
    }

    const errorBody = await request.json();
    const { digest, message, stack, path } = errorBody;

    // Reject extremely short or empty error reports
    if (!message && !digest) {
      return NextResponse.json(
        { success: false, message: "Empty error report" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find all users with the 'admin' role to notify
    const admins = await User.find({ role: "admin" }, "email firstName");

    if (!admins || admins.length === 0) {
      // Don't leak to client that no admins exist, but log it server-side
      console.warn(
        "Error report received, but no admin users found to notify.",
      );
      return NextResponse.json({
        success: true,
        message: "Error reported internally.",
      });
    }

    // Prepare the email service
    const emailService = new EmailService();

    const title = "🚨 High Severity CRASH Report";
    const content = `
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="color: #991b1b; margin-top: 0;">Unhandled Client Error</h3>
        <p style="margin-bottom: 8px;"><strong>Message:</strong> <span style="font-family: monospace;">${message || "N/A"}</span></p>
        <p style="margin-bottom: 8px;"><strong>Digest:</strong> <span style="font-family: monospace;">${digest || "N/A"}</span></p>
        <p style="margin-bottom: 0;"><strong>Path:</strong> <span style="font-family: monospace;">${path || "Unknown path"}</span></p>
      </div>

      ${
        stack
          ? `
        <h4 style="margin-bottom: 8px;">Stack Trace:</h4>
        <pre style="background: #1f2937; color: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.5;">${stack}</pre>
        `
          : ""
      }
    `;

    const htmlBody = emailService.generateSimpleMinimalistTemplate(
      title,
      content,
    );

    // Blast out an email to all administrators found
    await Promise.all(
      admins.map((admin) =>
        emailService.sendEmail({
          subject: `[CRITICAL] Bucket Error Report: ${message ? message.substring(0, 50) : digest}`,
          to: { email: admin.email, name: admin.firstName },
          htmlBody,
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      message: "Error reported and admins notified.",
    });
  } catch (error) {
    // Failsafe to not crash the application if reporting fails
    console.error("Failed to process error report:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process error report" },
      { status: 500 },
    );
  }
}
