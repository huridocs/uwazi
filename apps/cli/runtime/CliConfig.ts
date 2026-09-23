import { ConfigMissing } from './ConfigMissing.js';
import type { ConnectionNeeds } from './CliConnections.js';

type Env = Record<string, string | undefined>;

const DATABASE_VARIABLES = [
  'MONGO_URI',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_APP_USER',
  'POSTGRES_APP_PASSWORD',
];

class CliConfig {
  /**
   * Only production is strict: development and tests rely on config.ts's local defaults, which
   * are correct there.
   */
  static requiredFor(needs: ConnectionNeeds, env: Env = process.env): string[] {
    if (env.NODE_ENV !== 'production') {
      return [];
    }

    return [...DATABASE_VARIABLES, ...(needs.redis ? ['REDIS_HOST'] : [])];
  }

  /**
   * Fails before any connection is attempted, instead of letting config.ts fall back to
   * localhost defaults: from a shell without the service's environment, those defaults would
   * silently point the CLI at the wrong database.
   */
  static assertRequired(required: string[], env: Env = process.env): void {
    const missing = required.filter(name => !env[name]);

    if (missing.length) {
      throw new ConfigMissing(missing);
    }
  }
}

export { CliConfig };
export type { Env };
