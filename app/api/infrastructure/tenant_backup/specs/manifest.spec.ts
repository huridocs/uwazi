import { MalformedManifestError } from '../MalformedManifestError.js';
import { MANIFEST_VERSION, parseManifest, rewriteField, serializeManifest } from '../manifest.js';

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

  describe('rewriteField', () => {
    it('rewrites any field by zero-based index', () => {
      expect(rewriteField('a\tb\tc', 1, 'X')).toBe('a\tX\tc');
    });

    it('rewrites the first field', () => {
      expect(rewriteField('a\tb\tc', 0, 'X')).toBe('X\tb\tc');
    });

    it('rewrites the last field when there is no trailing tab', () => {
      expect(rewriteField('a\tb', 1, 'X')).toBe('a\tX');
    });

    it('throws when the index is beyond the fields', () => {
      expect(() => rewriteField('a\tb', 5, 'X')).toThrow(RangeError);
    });

    it('throws when the index is negative instead of corrupting the first field', () => {
      expect(() => rewriteField('a\tb\tc', -1, 'X')).toThrow(RangeError);
    });
  });
});
