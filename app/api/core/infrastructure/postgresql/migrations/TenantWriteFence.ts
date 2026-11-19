import { ChangeStream, type ChangeStreamDocument, type Db } from 'mongodb';
import { TenantWriteFenceUnavailable } from './TenantWriteFenceUnavailable.js';
import { TenantNotQuiet } from './TenantNotQuiet.js';
import { TenantWrittenDuringMigration } from './TenantWrittenDuringMigration.js';

type FenceWrite = { collection: string; operationType: string; at: Date };

type QuietOptions = { quietMs: number; timeoutMs: number };

type PendingWait = {
  quietMs: number;
  quietTimer?: NodeJS.Timeout;
  timeoutTimer: NodeJS.Timeout;
  resolve: () => void;
  reject: (error: Error) => void;
};

const LAST_WRITES_SHOWN = 10;

const describeWrite = (write: FenceWrite) =>
  `${write.at.toISOString()} ${write.operationType} ${write.collection}`;

/**
 * Watches a whole tenant database to prove nobody writes to it. Any stream error means the fence
 * can no longer prove that, so it is surfaced instead of swallowed.
 */
class TenantWriteFence {
  private stream?: ChangeStream;

  private writes: FenceWrite[] = [];

  private streamError?: TenantWriteFenceUnavailable;

  private pendingWait?: PendingWait;

  private quietPoint?: Date;

  constructor(private readonly db: Db) {}

  /**
   * Resolves once the server has opened the stream (its first resume token arrives): `watch()`
   * opens it lazily, so a write made before then would never be reported.
   */
  async start(): Promise<void> {
    const stream = this.db.watch();
    this.stream = stream;

    await new Promise<void>((resolve, reject) => {
      let opened = false;
      stream.once(ChangeStream.RESUME_TOKEN_CHANGED, () => {
        opened = true;
        resolve();
      });
      stream.on('change', (change: ChangeStreamDocument) => this.record(change));
      stream.on('error', (error: Error) => {
        const unavailable = new TenantWriteFenceUnavailable(
          `Cannot watch ${this.db.databaseName} for writes: ${error.message}`
        );
        this.streamError = unavailable;
        this.settleWait(wait => wait.reject(unavailable));
        if (!opened) {
          reject(unavailable);
        }
      });
    });
  }

  writesSince(mark: Date): FenceWrite[] {
    this.throwIfStreamErrored();
    return this.writes.filter(write => write.at >= mark);
  }

  /**
   * Resolves once `quietMs` passes with no write; each write restarts the countdown. The moment it
   * resolves becomes the quiet point `assertNoWrites` checks against.
   */
  async waitUntilQuiet({ quietMs, timeoutMs }: QuietOptions): Promise<void> {
    this.throwIfStreamErrored();
    const waitStartedAt = new Date();

    await new Promise<void>((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        const lastWrites = this.writesSince(waitStartedAt).slice(-LAST_WRITES_SHOWN);
        this.settleWait(wait =>
          wait.reject(
            new TenantNotQuiet(
              `${this.db.databaseName} was not quiet for ${quietMs}ms within ${timeoutMs}ms. ` +
                `Last writes:\n${lastWrites.map(describeWrite).join('\n')}`
            )
          )
        );
      }, timeoutMs);

      this.pendingWait = { quietMs, timeoutTimer, resolve, reject };
      this.restartQuietCountdown();
    });
  }

  assertNoWrites(): void {
    if (!this.quietPoint) {
      throw new Error('assertNoWrites called before waitUntilQuiet resolved');
    }

    const writes = this.writesSince(this.quietPoint);
    if (writes.length === 0) {
      return;
    }

    const counts = writes.reduce<Record<string, number>>(
      (acc, write) => ({ ...acc, [write.collection]: (acc[write.collection] ?? 0) + 1 }),
      {}
    );
    const summary = Object.entries(counts)
      .map(([collection, count]) => `${collection}: ${count}`)
      .join(', ');
    throw new TenantWrittenDuringMigration(
      `${this.db.databaseName} was written during the migration (${summary})`
    );
  }

  async stop(): Promise<void> {
    this.settleWait(wait =>
      wait.reject(new TenantWriteFenceUnavailable('Fence stopped before the tenant was quiet'))
    );
    const { stream } = this;
    this.stream = undefined;
    await stream?.close();
  }

  private record(change: ChangeStreamDocument): void {
    const collection = 'ns' in change && change.ns && 'coll' in change.ns ? change.ns.coll : '';
    this.writes.push({ collection, operationType: change.operationType, at: new Date() });
    this.restartQuietCountdown();
  }

  private restartQuietCountdown(): void {
    const wait = this.pendingWait;
    if (!wait) {
      return;
    }
    clearTimeout(wait.quietTimer);
    wait.quietTimer = setTimeout(() => {
      this.settleWait(settled => {
        this.quietPoint = new Date();
        settled.resolve();
      });
    }, wait.quietMs);
  }

  private settleWait(settle: (wait: PendingWait) => void): void {
    const wait = this.pendingWait;
    if (!wait) {
      return;
    }
    this.pendingWait = undefined;
    clearTimeout(wait.quietTimer);
    clearTimeout(wait.timeoutTimer);
    settle(wait);
  }

  private throwIfStreamErrored(): void {
    if (this.streamError) {
      throw this.streamError;
    }
  }
}

export type { FenceWrite };
export { TenantWriteFence };
