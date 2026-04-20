"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loader from "@/components/ui/aevr/loader";
import { Card, CardContent } from "@/components/ui/card";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message =
    searchParams.get("message") || "An error occurred during authentication";

  return (
    <div className="wrapper w-full max-w-3xl mx-auto px-4 h-full py-12 flex flex-col gap-2">
      <header>
        <div className="wrapper">
          <h1 className="text-4xl font-bold text-background lg:text-foreground">
            Authentication Failed
          </h1>
          <p className="text-lg font-medium text-background lg:text-foreground">
            {message}
          </p>
        </div>
      </header>
      <section className="flex-1 flex items-center justify-center w-full">
        <div className="wrapper w-full ">
          <Card className="lg:border-0 lg:shadow-none ">
            <CardContent className="lg:p-0 flex gap-2">
              <Button asChild className="max-lg:grow">
                <Link href="/login">Try Again</Link>
              </Button>
              <Button asChild className="max-lg:grow" variant="outline">
                <Link href="/">Go to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Loader loading />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
