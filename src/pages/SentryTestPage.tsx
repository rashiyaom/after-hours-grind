import * as Sentry from "@sentry/react";
import { useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

const SentryExampleError = new Error("This is a test error from SentryTestPage");
SentryExampleError.name = "SentryExampleError";

export default function SentryTestPage() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleThrowError = async () => {
    setIsLoading(true);
    setLastError(null);
    try {
      Sentry.captureMessage("User clicked the button to throw a test error");
      await Sentry.startSpan(
        {
          name: "Test Error Span",
          op: "test",
        },
        async () => {
          // Simulate some async work
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      );
      setHasSentError(true);
      throw SentryExampleError;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      setLastError(errorMsg);
      Sentry.captureException(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <svg
              height="48"
              width="48"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="text-orange-500"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Sentry Test Page</h1>
          <p className="text-slate-400">
            Test error tracking and performance monitoring
          </p>
        </div>

        {/* Status Cards */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-4 border border-slate-700">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="text-sm">
              Sentry is initialized and ready to track errors
            </span>
          </div>

          {hasSentError && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/30 animate-pulse">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-emerald-300">
                Error sent to Sentry successfully!
              </span>
            </div>
          )}

          {lastError && (
            <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-4 border border-red-500/30">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Error caught:</p>
                <p className="text-xs text-red-200/80 font-mono break-words">
                  {lastError}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Action Button */}
        <div className="mb-8">
          <button
            onClick={handleThrowError}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Sending Error..." : "Throw Test Error"}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Clicking this will capture an error and send it to your Sentry
            project
          </p>
        </div>

        {/* Documentation Links */}
        <div className="space-y-2 border-t border-slate-700 pt-8">
          <p className="mb-4 text-sm font-semibold text-slate-300">Resources:</p>
          <a
            href="https://charusat-k3.sentry.io/issues/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            View Issues on Sentry Dashboard
          </a>
          <a
            href="https://docs.sentry.io/platforms/javascript/guides/react/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Sentry React Documentation
          </a>
          <a
            href="https://charusat-k3.sentry.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Sentry Project Dashboard
          </a>
        </div>

        {/* Code Example */}
        <div className="mt-8 rounded-lg bg-slate-900 p-4 border border-slate-700">
          <p className="mb-3 text-xs font-semibold text-slate-400 uppercase">
            Or trigger an error manually:
          </p>
          <pre className="text-xs text-slate-300 overflow-x-auto">
            <code>
              {`Sentry.captureException(
  new Error("Something went wrong")
);`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
