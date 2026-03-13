import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as Sentry from '@sentry/node';
import { config } from '#api/config.js';

export function initSentry() {
  if (config.sentry.dsn && !Sentry.isInitialized()) {
    Sentry.init({
      release: config.VERSION,
      dsn: config.sentry.dsn,
      environment: config.ENVIRONMENT,
      integrations: (defaults) => [
        ...defaults.filter((i) => i.name !== 'Redis'),
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
  }
}
