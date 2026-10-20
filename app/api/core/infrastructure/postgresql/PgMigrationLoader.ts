import { pathToFileURL } from 'url';
import { PgDataMigration } from './PgDataMigration.js';

type PgMigrationModule = { migration: PgDataMigration };

/** `modifiedAt` is the file's modification time, in milliseconds. */
type LoadPgMigration = (filePath: string, modifiedAt: number) => Promise<PgMigrationModule>;

/** How PgMigrator imports a `.ts` data migration. */
class PgMigrationLoader {
  /**
   * The module as it is on disk now. The import is keyed on the file's modification time, so a
   * long running worker picks up a migration edited after it first imported it, instead of the
   * copy the module cache kept.
   */
  static async fromDisk(filePath: string, modifiedAt: number): Promise<PgMigrationModule> {
    const url = pathToFileURL(filePath);
    url.searchParams.set('mtime', String(modifiedAt));
    return import(url.href);
  }

  /** A plain path import: what Jest's resolver understands, as it cannot resolve file URLs. */
  static async byPath(filePath: string): Promise<PgMigrationModule> {
    return import(filePath);
  }
}

export { PgMigrationLoader };
export type { LoadPgMigration, PgMigrationModule };
