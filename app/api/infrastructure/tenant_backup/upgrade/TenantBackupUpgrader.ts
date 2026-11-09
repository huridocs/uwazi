import { Readable, type Writable } from 'stream';
import { finished } from 'stream/promises';
import type { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { BackupNewerThanSchemaError } from '../BackupNewerThanSchemaError.js';
import { PgTenantBackup } from '../PgTenantBackup.js';
import { PrematureEndOfStreamError } from '../PrematureEndOfStreamError.js';
import { parseManifest, type ExportManifest } from '../manifest.js';
import type { ScratchConnections, ScratchDatabase } from './ScratchDatabase.js';

type UpgradeResult = {
  sourceTenant: string;
  fromVersion: number;
  toVersion: number;
  tables: string[];
};

type UpgradeOptions = {
  /** The tenant the upgraded backup is written under. Default: the backup's own source tenant. */
  tenantId?: string;
  /** Sort every table by its primary key, for a deterministic stream (e.g. a committed dump). */
  ordered?: boolean;
};

type TenantBackupUpgraderDeps = {
  latestVersion: () => number;
  createScratch: () => Promise<ScratchDatabase>;
  /** A migrator over the scratch connections whose tenant data migrations see only `tenantId`. */
  migratorFor: (connections: ScratchConnections, tenantId: string) => PgMigrator;
};

type SplitStream = { manifestLine: string; rest: AsyncIterable<Buffer> };

const NEWLINE = 0x0a;

async function readHead(iterator: AsyncIterator<Buffer>, read: Buffer): Promise<Buffer> {
  if (read.includes(NEWLINE)) return read;
  const next = await iterator.next();
  if (next.done) return read;
  return readHead(iterator, Buffer.concat([read, Buffer.from(next.value)]));
}

/** Reads up to the first newline, keeping whatever followed it at the front of `rest`. */
async function splitManifest(input: Readable): Promise<SplitStream> {
  const iterator: AsyncIterator<Buffer> = input[Symbol.asyncIterator]();
  const head = await readHead(iterator, Buffer.alloc(0));
  const newline = head.indexOf(NEWLINE);
  if (newline === -1) throw new PrematureEndOfStreamError('<manifest>');

  const leftover = head.subarray(newline + 1);
  async function* rest(): AsyncGenerator<Buffer> {
    if (leftover.length) yield leftover;
    yield* { [Symbol.asyncIterator]: () => iterator };
  }
  return { manifestLine: head.subarray(0, newline).toString('utf8'), rest: rest() };
}

function restream({ manifestLine, rest }: SplitStream): Readable {
  async function* chunks(): AsyncGenerator<Buffer> {
    yield Buffer.from(`${manifestLine}\n`);
    yield* rest;
  }
  return Readable.from(chunks());
}

/**
 * Brings a tenant backup stream to the latest Postgres schema without touching the live database:
 * a scratch database is migrated to the backup's version, the backup is loaded into it, the rest
 * of the migrations run over that data, and the result is exported. Postgres only: no Mongo
 * migrations, no Elasticsearch, no files.
 */
class TenantBackupUpgrader {
  constructor(private readonly deps: TenantBackupUpgraderDeps) {}

  async upgrade(
    input: Readable,
    output: Writable,
    options: UpgradeOptions = {}
  ): Promise<UpgradeResult> {
    const split = await splitManifest(input);
    const manifest = parseManifest(split.manifestLine);
    const latest = this.deps.latestVersion();
    if (manifest.schemaVersion > latest) {
      throw new BackupNewerThanSchemaError(manifest.schemaVersion, latest);
    }

    const tenantId = options.tenantId ?? manifest.sourceTenant;
    if (manifest.schemaVersion === latest && tenantId === manifest.sourceTenant) {
      return TenantBackupUpgrader.passThrough(split, manifest, output);
    }

    const tables = await this.throughScratch(restream(split), output, {
      fromVersion: manifest.schemaVersion,
      tenantId,
      ordered: options.ordered ?? false,
    });
    return {
      sourceTenant: tenantId,
      fromVersion: manifest.schemaVersion,
      toVersion: latest,
      tables,
    };
  }

  private async throughScratch(
    backup: Readable,
    output: Writable,
    target: { fromVersion: number; tenantId: string; ordered: boolean }
  ): Promise<string[]> {
    const scratch = await this.deps.createScratch();
    try {
      const connections = scratch.connections();
      const migrator = this.deps.migratorFor(connections, target.tenantId);
      const tenantBackup = new PgTenantBackup(connections.pool);

      await migrator.migrate({ until: target.fromVersion });
      await tenantBackup.import(target.tenantId, backup);
      await migrator.migrate();
      return await tenantBackup.export(target.tenantId, output, { ordered: target.ordered });
    } finally {
      await scratch.drop();
    }
  }

  private static async passThrough(
    split: SplitStream,
    manifest: ExportManifest,
    output: Writable
  ): Promise<UpgradeResult> {
    const stream = restream(split);
    stream.pipe(output, { end: false });
    await finished(stream);
    return {
      sourceTenant: manifest.sourceTenant,
      fromVersion: manifest.schemaVersion,
      toVersion: manifest.schemaVersion,
      tables: manifest.tables.map(table => table.name),
    };
  }
}

export { TenantBackupUpgrader };
export type { TenantBackupUpgraderDeps, UpgradeOptions, UpgradeResult };
