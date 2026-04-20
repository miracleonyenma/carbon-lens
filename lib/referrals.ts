import { cookies } from "next/headers";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

/**
 * Consumes the `bucket-referral` tracking cookie dropped by `/r/[payTag]` links.
 * Checks the given user ID; if they don't already have a `referredBy` mapped,
 * assigns it using the cookie's ObjectId value and clears the cookie.
 */
export async function applyReferralCookie(newUserId: string) {
  try {
    const cookieStore = await cookies();
    const referrerId = cookieStore.get("bucket-referral")?.value;

    if (!referrerId) {
      return; // No pending referral
    }

    await connectDB();
    const user = await User.findById(newUserId);

    if (user && !user.referredBy && user._id.toString() !== referrerId) {
      user.referredBy = referrerId;
      await user.save();

      // Clear cookie immediately so it can't be repeatedly claimed by family sharing same device
      cookieStore.delete("bucket-referral");
    }
  } catch (error) {
    console.error("applyReferralCookie Error:", error);
    // Swallow error asynchronously so we don't block critical login path execution
  }
}
