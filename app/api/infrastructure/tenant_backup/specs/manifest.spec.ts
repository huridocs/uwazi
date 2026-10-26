import { MalformedManifestError } from '../MalformedManifestError.js';
import {
  MANIFEST_VERSION,
  parseManifest,
  rewriteTenantId,
  serializeManifest,
} from '../manifest.js';

describe('manifest', () => {
  const tables = [
    { name: 'templates', columns: ['tenant_id', '_id', 'name'] },
    { name: 'settings', columns: ['tenant_id', '_id', 'sync'] },
  ];

  it('serializes and parses back the same manifest, including its schema version', () => {
    const line = serializeManifest('source-tenant', 12, tables);

    expect(parseManifest(line)).toEqual({
      version: MANIFEST_VERSION,
      sourceTenant: 'source-tenant',
      schemaVersion: 12,
      tables,
    });
  });

  it('rejects a first line that is not JSON', () => {
    expect(() => parseManifest('not json')).toThrow(MalformedManifestError);
  });

  it('rejects a manifest with the wrong version', () => {
    const line = JSON.stringify({
      version: MANIFEST_VERSION + 1,
      sourceTenant: 's',
      schemaVersion: 0,
      tables: [],
    });

    expect(() => parseManifest(line)).toThrow(MalformedManifestError);
  });

  it('rejects a manifest without a schema version', () => {
    const line = JSON.stringify({ version: MANIFEST_VERSION, sourceTenant: 's', tables: [] });

    expect(() => parseManifest(line)).toThrow(MalformedManifestError);
  });

  it('rejects a negative schema version', () => {
    const line = JSON.stringify({
      version: MANIFEST_VERSION,
      sourceTenant: 's',
      schemaVersion: -1,
      tables: [],
    });

    expect(() => parseManifest(line)).toThrow(MalformedManifestError);
  });

  it('rejects a table whose first column is not tenant_id', () => {
    const line = JSON.stringify({
      version: MANIFEST_VERSION,
      sourceTenant: 's',
      schemaVersion: 0,
      tables: [{ name: 'templates', columns: ['_id', 'tenant_id'] }],
    });

    expect(() => parseManifest(line)).toThrow(MalformedManifestError);
  });

  it('rejects a manifest with unknown keys', () => {
    const line = JSON.stringify({
      version: MANIFEST_VERSION,
      sourceTenant: 's',
      schemaVersion: 0,
      tables: [],
      unexpected: true,
    });

    expect(() => parseManifest(line)).toThrow(MalformedManifestError);
  });

  describe('rewriteTenantId', () => {
    it('rewrites the first tab-delimited field and keeps the rest', () => {
      expect(rewriteTenantId('source\tid\tname', 'target')).toBe('target\tid\tname');
    });

    it('handles a line with no tab (tenant_id only)', () => {
      expect(rewriteTenantId('source', 'target')).toBe('target');
    });

    it('preserves empty trailing fields', () => {
      expect(rewriteTenantId('source\ta\t', 'target')).toBe('target\ta\t');
    });
  });
});
