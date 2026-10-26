import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The import stream is empty or its manifest line cannot be parsed. */
export class MalformedManifestError extends DomainError {
  constructor(message: string) {
    super(message, 'tenant_backup.malformed_manifest');
  }
}
