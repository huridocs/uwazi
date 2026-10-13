import type { Readable } from 'stream';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { ActivityLogArchive } from './ActivityLogArchive.js';
import { ActivityLogDataSource } from './contracts/ActivityLogDataSource.js';

/** The tenant's storage, as the files module offers it. */
type ArchiveStorage = {
  storeFile(filename: string, file: Readable, type: 'activitylog'): Promise<unknown>;
};

type Deps = {
  activityLogDS: ActivityLogDataSource;
  storage: ArchiveStorage;
  /** How many entries the tenant keeps in the database. */
  maxRows: number;
  /** How many entries go in each archive file. */
  chunkRows: number;
  /** Only tenants whose log is bounded by count are archived; the others expire entries by age. */
  enabled: boolean;
};

type Output = { archivedRows: number; files: string[] };

/**
 * Moves the oldest entries of the tenant's activity log to its storage, once it holds more than it
 * may keep. Only whole files are written: the overflow waits in the database until it fills one.
 *
 * Each file is stored before its entries are removed, so a failure in between leaves the entries
 * in place and the next run stores the same file again under the same name.
 */
class ArchiveActivityOverflow extends AbstractUseCase<void, Output, Deps> {
  static readonly CHUNK_ROWS = 10_000;

  async execute(): Promise<Output> {
    if (!this.deps.enabled) return { archivedRows: 0, files: [] };

    const overflow = (await this.deps.activityLogDS.count()) - this.deps.maxRows;
    const wholeFiles = Math.max(0, Math.floor(overflow / this.deps.chunkRows));

    return this.archive(wholeFiles, { archivedRows: 0, files: [] });
  }

  /** One file at a time, oldest entries first. */
  private async archive(filesLeft: number, done: Output): Promise<Output> {
    if (filesLeft === 0) return done;

    const entries = await this.deps.activityLogDS.oldest(this.deps.chunkRows);
    if (entries.length < this.deps.chunkRows) return done;

    const file = ActivityLogArchive.of(entries);
    await this.deps.storage.storeFile(file.filename, file.content(), 'activitylog');
    await this.deps.activityLogDS.remove(entries);

    return this.archive(filesLeft - 1, {
      archivedRows: done.archivedRows + file.size,
      files: [...done.files, file.filename],
    });
  }
}

export { ArchiveActivityOverflow };
export type { Output as ArchiveActivityOverflowOutput, ArchiveStorage };
