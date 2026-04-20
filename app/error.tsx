"use client";

import { ErrorState } from "@/components/shared/error-state";

interface NextErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: NextErrorProps) {
  return <ErrorState mode="error" error={error} reset={reset} />;
}
