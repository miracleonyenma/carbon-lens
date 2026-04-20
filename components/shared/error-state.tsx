"use client";

import { InfoBox } from "@/components/ui/aevr/info-box";
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardHeader,
  SettingsCardTitle,
  SettingsRow,
  SettingsRowContent,
} from "@/components/ui/aevr/settings-card";
import SummaryCard from "@/components/ui/aevr/summary-card";
import { Button } from "@/components/ui/button";
import { Home, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

const IS_DEV = process.env.NODE_ENV === "development";

interface ErrorStateProps {
  mode: "error" | "not-found";
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  infoBoxType?: "error" | "warning" | "info" | "success" | "default";
}

export function ErrorState({
  mode,
  error,
  reset,
  title,
  description,
  infoBoxType,
}: ErrorStateProps) {
  const reportedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Attempt to report this error to administrators if it hasn't been reported yet in this session
    if (mode === "error" && error && !reportedRef.current) {
      reportedRef.current = true;

      const reportContent = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        path:
          typeof window !== "undefined"
            ? window.location.href
            : "Server/Unknown",
      };

      console.error("Caught in Global Error Boundary:", error);

      // Fire and forget POST request
      fetch("/api/v1/system/report-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportContent),
      }).catch((e) => console.error("Could not dispatch error report:", e));
    }
  }, [error, mode]);

  const emailBody =
    mode === "error"
      ? `
Digest:
${error?.digest ?? "N/A"}

Stack:
${error?.stack ?? "N/A"}
`
      : `Report Issue: The page at ${
          typeof window !== "undefined" ? window.location.href : "unknown URL"
        } was not found.`;

  const finalTitle =
    title || (mode === "error" ? "Something went wrong" : "Page not found");

  const finalDescription =
    description ||
    (mode === "error"
      ? error?.message ||
        "We're sorry, but something went wrong. Please try again later."
      : "The page you are looking for doesn't exist or has been moved.");

  const finalInfoBoxType =
    infoBoxType || (mode === "error" ? "error" : "warning");

  const summaryItems =
    mode === "error"
      ? [
          {
            label: "Step 1",
            value: "Refresh the page to see if the error resolves",
          },
          {
            label: "Step 2",
            value: "Check your internet connection",
          },
          {
            label: "Step 3",
            value: "Return to the homepage and try again",
          },
        ]
      : [
          {
            label: "Step 1",
            value: "Check the URL for any typos",
          },
          {
            label: "Step 2",
            value: "Return to the homepage",
          },
          {
            label: "Step 3",
            value: "Use the navigation menu to find what you need",
          },
        ];

  const summaryFooter =
    mode === "error"
      ? {
          label: "Note",
          value:
            "Don't worry — our engineering team has been automatically notified.",
        }
      : undefined;

  return (
    <section className="site-section flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-900">
      <div className="wrapper max-w-2xl w-full flex flex-col gap-4">
        {/* Main Alert */}
        <InfoBox
          type={finalInfoBoxType}
          title={<span className="text-xl font-semibold">{finalTitle}</span>}
          description={finalDescription}
        />

        {/* Help & Details Section */}
        <SettingsCard className="bg-white dark:bg-neutral-950 border-none shadow-sm">
          <SettingsCardHeader className="pb-4">
            <SettingsCardTitle className="text-lg">
              What you can try:
            </SettingsCardTitle>
          </SettingsCardHeader>

          <SettingsCardContent>
            <div className="px-6 mb-4">
              <SummaryCard
                layout="vertical"
                items={summaryItems}
                {...(summaryFooter ? { summary: summaryFooter } : {})}
              />
            </div>

            {IS_DEV && error?.stack && mode === "error" && (
              <SettingsRow className="px-6 sm:px-6">
                <SettingsRowContent className="w-full">
                  <details className="group w-full">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none transition-colors">
                      Technical Details (Stack Trace)
                    </summary>
                    <div className="mt-3 p-4 rounded-xl border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <pre className="overflow-auto whitespace-pre-wrap text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                        {error.stack}
                      </pre>
                    </div>
                  </details>
                </SettingsRowContent>
              </SettingsRow>
            )}

            {error?.digest && mode === "error" && (
              <SettingsRow className="px-6 sm:px-6">
                <SettingsRowContent className="w-full">
                  <details className="group w-full">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none transition-colors">
                      Digest ID
                    </summary>
                    <div className="mt-3 p-4 rounded-xl border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <pre className="overflow-auto whitespace-pre-wrap text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                        {error.digest}
                      </pre>
                    </div>
                  </details>
                </SettingsRowContent>
              </SettingsRow>
            )}

            <div className="flex flex-wrap sm:flex-row gap-3 p-6 pt-4 mt-2 dark:border-neutral-800">
              {reset && mode === "error" && (
                <>
                  <Button onClick={reset}>Try Again</Button>
                </>
              )}
              <Button onClick={() => router.back()}>Go Back</Button>

              <Button
                asChild
                variant={mode === "error" ? "secondary" : "default"}
              >
                <Link href="/">
                  <Home size={16} color="currentColor" />
                  <span>Home</span>
                </Link>
              </Button>

              {mode === "error" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.reload();
                    }
                  }}
                >
                  Reload Page
                </Button>
              )}

              <Button asChild variant={"secondary"}>
                <Link
                  href={`mailto:${
                    process.env.NEXT_PUBLIC_APP_SUPPORT_MAIL ||
                    "support@100pay.co"
                  }?subject=${
                    mode === "error" ? "Error Report" : "Page Not Found Report"
                  }&body=${encodeURIComponent(emailBody)}`}
                >
                  <Mail size={16} color="currentColor" />
                  <span>Contact Support</span>
                </Link>
              </Button>
            </div>
          </SettingsCardContent>
        </SettingsCard>
      </div>
    </section>
  );
}
