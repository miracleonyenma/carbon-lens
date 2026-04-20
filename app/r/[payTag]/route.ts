import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ payTag: string }> },
) {
  try {
    const { payTag } = await params;

    // Verify the payTag belongs to a real active user to prevent link spoofing
    await connectDB();
    const referringUser = await User.findOne({ payTag: payTag });

    if (!referringUser) {
      // Invalid code, just send them to login silently
      return NextResponse.redirect(new URL("/register", req.url));
    }

    // Valid referee found. Deposit HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("bucket-referral", referringUser._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    const destination = new URL("/register", req.url);
    destination.searchParams.set("ref", payTag);
    return NextResponse.redirect(destination);
  } catch (error) {
    console.error("Referral Cookie Route error:", error);
    // Graceful fallback to root
    return NextResponse.redirect(new URL("/register", req.url));
  }
}
