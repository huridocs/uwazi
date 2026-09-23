import { ConfigMissing } from './ConfigMissing.js';

class CliConfig {
  /**
   * Fails before any connection is attempted, instead of letting config.ts fall back to
   * localhost defaults: from a shell without the service's environment, those defaults would
   * silently point the CLI at the wrong database.
   */
  static assertRequired(
    required: string[],
    env: Record<string, string | undefined> = process.env
  ): void {
    const missing = required.filter(name => !env[name]);

    if (missing.length) {
      throw new ConfigMissing(missing);
    }
  }
}

export { CliConfig };
