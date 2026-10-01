import type { Knex } from 'knex';
import type { TenantsChangeFeed } from '../application/contracts/TenantsChangeFeed.js';

type Callbacks = { onChange: () => void; onError: (error: Error) => void };

/**
 * Notices registry changes by polling the `tenants_version` counter, which a trigger moves
 * whenever a field a running process uses changes.
 */
class PostgresTenantsChangeFeed implements TenantsChangeFeed {
  private timer?: NodeJS.Timeout;

  private lastVersion?: number;

  private stopped = true;

  constructor(
    private readonly knex: () => Knex,
    private readonly intervalMs: number
  ) {}

  /** The first read is the baseline: the caller has already loaded the registry as it is. */
  async start(onChange: () => void, onError: (error: Error) => void): Promise<void> {
    this.lastVersion = await this.readVersion();
    this.stopped = false;
    this.schedule({ onChange, onError });
  }

  async stop(): Promise<void> {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  /** Chained after each poll, never an interval: a slow database cannot stack polls up. */
  private schedule(callbacks: Callbacks): void {
    this.timer = setTimeout(() => {
      void this.poll(callbacks);
    }, this.intervalMs);
    // A script that only set the registry up must still be able to exit.
    this.timer.unref();
  }

  private async poll({ onChange, onError }: Callbacks): Promise<void> {
    try {
      const version = await this.readVersion();
      if (!this.stopped && version !== this.lastVersion) {
        // Only a good read moves the baseline, so a change made during an outage is still
        // reported by the first poll that succeeds afterwards.
        this.lastVersion = version;
        onChange();
      }
    } catch (error) {
      if (!this.stopped) onError(error as Error);
    }

    if (!this.stopped) this.schedule({ onChange, onError });
  }

  private async readVersion(): Promise<number> {
    const row = await this.knex()('tenants_version').first('version');
    return Number(row?.version);
  }
}

export { PostgresTenantsChangeFeed };
