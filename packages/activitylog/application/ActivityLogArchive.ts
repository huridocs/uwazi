import { Readable } from 'stream';
import { createGzip } from 'zlib';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ActivityLogEntry } from '../domain/ActivityLogEntry.js';

/**
 * A file of entries taken out of the activity log: one entry per line as JSON, gzipped. It is named
 * after the first and last entries it holds, so archiving the same entries again replaces the file
 * instead of adding another.
 */
class ActivityLogArchive {
  private constructor(
    readonly filename: string,
    private readonly entries: ActivityLogEntry[]
  ) {}

  static of(entries: ActivityLogEntry[]): ActivityLogArchive {
    const first = entries[0].props;
    const last = entries[entries.length - 1].props;

    return new ActivityLogArchive(
      `${first.time}_${last.time}_${first.id}_activity.jsonl.gz`,
      entries
    );
  }

  get size(): number {
    return this.entries.length;
  }

  content(): FileContents {
    return new FileContents(() => Readable.from(this.lines()).pipe(createGzip()));
  }

  private *lines(): Generator<string> {
    for (const { props } of this.entries) {
      yield `${JSON.stringify(props)}\n`;
    }
  }
}

export { ActivityLogArchive };
