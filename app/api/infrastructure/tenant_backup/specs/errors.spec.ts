import { MalformedManifestError } from '../MalformedManifestError.js';
import { PrematureEndOfStreamError } from '../PrematureEndOfStreamError.js';
import { SchemaVersionMismatchError } from '../SchemaVersionMismatchError.js';
import { UnknownTableInManifestError } from '../UnknownTableInManifestError.js';
import { TenantAlreadyHasDataError } from '../TenantAlreadyHasDataError.js';

describe('tenant backup errors', () => {
  it('maps every import error to the validation category', () => {
    expect(new MalformedManifestError('bad stream').category).toBe('validation');
    expect(new UnknownTableInManifestError('captchas').category).toBe('validation');
    expect(new PrematureEndOfStreamError('entities').category).toBe('validation');
    expect(new SchemaVersionMismatchError(1, 2).category).toBe('validation');
  });

  it('maps the tenant-has-data error to the conflict category', () => {
    expect(new TenantAlreadyHasDataError('x').category).toBe('conflict');
  });
});
