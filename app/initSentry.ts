import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { config } from 'api/config';

let sentryWasInitialized = false;

export function initSentry() {
  if (config.sentry.dsn && !sentryWasInitialized) {
    Sentry.init({
      release: config.VERSION,
      dsn: config.sentry.dsn,
      environment: config.ENVIRONMENT,
      integrations: [
        Sentry.httpIntegration({ tracing: true }),
        new Tracing.Integrations.Mongo({ useMongoose: true }),
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
    sentryWasInitialized = true;
  }
}
