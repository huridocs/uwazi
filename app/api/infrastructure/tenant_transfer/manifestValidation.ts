import { UnknownTableInManifestError } from './UnknownTableInManifestError.js';
import { SchemaVersionMismatchError } from './SchemaVersionMismatchError.js';
import type { ExportManifest } from './manifest.js';

/**
 * Pre-flight gate for an import stream: the export's schema version must match this database's,
 * and every named table must be a known tenant data table. Both run before any COPY is started.
 */
export async function validateManifest(
  manifest: ExportManifest,
  knownTables: Set<string>,
  getSchemaVersion: () => Promise<number>
): Promise<void> {
  const actual = await getSchemaVersion();
  if (actual !== manifest.schemaVersion) {
    throw new SchemaVersionMismatchError(manifest.schemaVersion, actual);
  }
  const unknown = manifest.tables.find(table => !knownTables.has(table.name));
  if (unknown) throw new UnknownTableInManifestError(unknown.name);
}
