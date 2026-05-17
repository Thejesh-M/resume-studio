"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { errorReporting } from "@/services/error-reporting";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    errorReporting.reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8">
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
