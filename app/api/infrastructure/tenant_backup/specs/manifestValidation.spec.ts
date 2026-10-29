import { MalformedManifestError } from '../MalformedManifestError.js';
import { SchemaVersionMismatchError } from '../SchemaVersionMismatchError.js';
import { UnknownTableInManifestError } from '../UnknownTableInManifestError.js';
import type { ExportManifest } from '../manifest.js';
import { validateManifest } from '../manifestValidation.js';

const columnsByTable = new Map([
  ['entities', ['tenant_id', 'id', 'title']],
  ['templates', ['tenant_id', '_id', 'name']],
]);

const manifest = (tables: ExportManifest['tables']): ExportManifest => ({
  version: 1,
  sourceTenant: 'source',
  schemaVersion: 0,
  tables,
});

describe('validateManifest', () => {
  const getSchemaVersion = async () => 0;

  it('rejects a schema version that differs from the database', async () => {
    await expect(
      validateManifest(manifest([]), columnsByTable, async () => 1)
    ).rejects.toBeInstanceOf(SchemaVersionMismatchError);
  });

  it('rejects a table that is not known tenant data', async () => {
    await expect(
      validateManifest(
        manifest([{ name: 'captchas', columns: ['tenant_id', 'x'] }]),
        columnsByTable,
        getSchemaVersion
      )
    ).rejects.toBeInstanceOf(UnknownTableInManifestError);
  });

  it('rejects a table whose columns do not match the schema', async () => {
    await expect(
      validateManifest(
        manifest([{ name: 'entities', columns: ['tenant_id', 'id'] }]),
        columnsByTable,
        getSchemaVersion
      )
    ).rejects.toBeInstanceOf(MalformedManifestError);
  });

  it('accepts a manifest that matches the schema', async () => {
    await expect(
      validateManifest(
        manifest([{ name: 'entities', columns: ['tenant_id', 'id', 'title'] }]),
        columnsByTable,
        getSchemaVersion
      )
    ).resolves.toBeUndefined();
  });
});
