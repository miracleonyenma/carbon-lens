import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, phone, referralCode } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 },
      );
    }

    let referredById = null;
    if (referralCode) {
      const referringUser = await User.findOne({ payTag: referralCode });
      if (referringUser) {
        referredById = referringUser._id;
      }
    } else {
      // Fallback: Check if there's a referral link cookie set
      const cookieStore = await cookies();
      const cookieReferredById = cookieStore.get("bucket-referral")?.value;
      if (cookieReferredById) {
        referredById = cookieReferredById;
        // Optionally map it to valid ObjectId type if needed, mongoose does this automatically
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      ...(referredById && { referredBy: referredById }),
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
