import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { init, isInitialized } from '@sentry/node-core/light';
import { config } from '#api/config.js';

export function initSentry() {
  if (config.sentry.dsn && !isInitialized()) {
    init({
      release: config.VERSION,
      dsn: config.sentry.dsn,
      environment: config.ENVIRONMENT,
      integrations: defaults => [
        ...defaults.filter(i => i.name !== 'Redis'),
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
  }
}
