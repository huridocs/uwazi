import { ChangeStream, type ChangeStreamDocument, type Db } from 'mongodb';
import { TenantWriteFenceUnavailable } from './TenantWriteFenceUnavailable.js';

type FenceWrite = { collection: string; operationType: string; at: Date };

/**
 * Watches a whole tenant database to prove nobody writes to it. Any stream error means the fence
 * can no longer prove that, so it is surfaced instead of swallowed.
 */
class TenantWriteFence {
  private stream?: ChangeStream;

  private writes: FenceWrite[] = [];

  private streamError?: TenantWriteFenceUnavailable;

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

  async stop(): Promise<void> {
    const { stream } = this;
    this.stream = undefined;
    await stream?.close();
  }

  private record(change: ChangeStreamDocument): void {
    const collection = 'ns' in change && change.ns && 'coll' in change.ns ? change.ns.coll : '';
    this.writes.push({ collection, operationType: change.operationType, at: new Date() });
  }

  private throwIfStreamErrored(): void {
    if (this.streamError) {
      throw this.streamError;
    }
  }
}

export type { FenceWrite };
export { TenantWriteFence };
