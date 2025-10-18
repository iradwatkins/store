import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Enable in production only
  enabled: process.env.NODE_ENV === 'production',

  // Server-specific options
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
