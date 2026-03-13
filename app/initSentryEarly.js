import 'dotenv/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
// eslint-disable-next-line node/no-restricted-import -- must not import app code so Sentry runs before other modules
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const version = JSON.parse(readFileSync(packagePath, 'utf-8')).version;
const dsn = process.env.SENTRY_API_DSN;
if (dsn) {
  Sentry.init({
    release: version,
    dsn,
    environment: process.env.ENVIRONMENT || 'development',
    integrations: defaults => [
      ...defaults.filter(i => i.name !== 'Redis'),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 0.1,
  });
}
