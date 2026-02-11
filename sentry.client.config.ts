import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring - sample 10% of transactions
  tracesSampleRate: 0.1,

  // Disable session replay for free tier
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Environment tagging
  environment: process.env.NODE_ENV,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
