/**
 * Lightweight error reporting service.
 * Replace the implementation with Sentry, Datadog, or similar in production.
 */

interface ErrorContext {
  readonly digest?: string;
  readonly componentStack?: string;
  readonly [key: string]: unknown;
}

function reportError(error: Error, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "production") {
    // TODO: Replace with Sentry.captureException(error, { extra: context })
    // or your preferred error reporting service.
    // For now, POST to an API endpoint if configured.
    const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_URL;
    if (endpoint) {
      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          ...context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail — don't let error reporting crash the app
      });
    }
  }

  // Always log in development
  if (process.env.NODE_ENV !== "production") {
    console.error("[ErrorReporting]", error, context);
  }
}

export const errorReporting = { reportError };
