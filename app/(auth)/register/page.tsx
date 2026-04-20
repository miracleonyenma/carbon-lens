import AuthForm from "@/components/Auth/Form";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Get Started";
const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  "Create an account to continue to your account";

const RegisterPage = async () => {
  const cookieStore = await cookies();
  const referrerId = cookieStore.get("bucket-referral")?.value;
  let initialReferralCode = "";

  if (referrerId) {
    try {
      await connectDB();
      const referrer = await User.findById(referrerId).lean<{
        payTag: string;
      }>();
      if (referrer && referrer.payTag) {
        initialReferralCode = referrer.payTag;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <div className="wrapper w-full gap-4 max-w-2xl mx-auto px-4 h-full py-12 flex flex-col ">
      <header>
        <div className="wrapper">
          <h1 className="text-4xl font-bold text-background dark:text-foreground lg:text-foreground">
            {APP_NAME}
          </h1>
          <p className="text-lg font-medium text-background dark:text-foreground lg:text-foreground">
            {APP_DESCRIPTION}
          </p>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center w-full">
        <div className="wrapper w-full">
          <Suspense fallback={null}>
            <AuthForm
              mode="register"
              initialReferralCode={initialReferralCode}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
