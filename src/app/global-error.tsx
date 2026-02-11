"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            background: "#faf7f5",
          }}
        >
          <div
            style={{
              textAlign: "center",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "400px",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#881337",
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#be123c",
                marginBottom: "1.5rem",
              }}
            >
              We&apos;ve been notified and are looking into it.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                background: "#e11d48",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
