"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const kycVerified = searchParams.get("kycVerified") === "true";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {kycVerified ? "✅ Verified!" : "✓ Connected!"}
          </CardTitle>
          <CardDescription className="text-center">
            {kycVerified
              ? "Your PayID account is connected and verified"
              : "Your PayID account has been connected successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!kycVerified && (
            <p className="text-sm text-muted-foreground text-center">
              Complete KYC verification to unlock all features
            </p>
          )}
          <div className="flex flex-col gap-2">
            {!kycVerified && (
              <Button asChild>
                <Link href="/kyc/verify">Start KYC Verification</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                ✓ Connected!
              </CardTitle>
              <CardDescription className="text-center">
                Loading...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
