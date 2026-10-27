import { MalformedManifestError } from '../MalformedManifestError.js';
import { PrematureEndOfStreamError } from '../PrematureEndOfStreamError.js';
import { SchemaVersionMismatchError } from '../SchemaVersionMismatchError.js';
import { UnknownTableInManifestError } from '../UnknownTableInManifestError.js';

describe('tenant backup errors', () => {
  it('maps every import error to the validation category', () => {
    expect(new MalformedManifestError('bad stream').category).toBe('validation');
    expect(new UnknownTableInManifestError('captchas').category).toBe('validation');
    expect(new PrematureEndOfStreamError('entities').category).toBe('validation');
    expect(new SchemaVersionMismatchError(1, 2).category).toBe('validation');
  });
});
