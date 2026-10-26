import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The import stream ended before the current table's COPY section was complete. */
export class PrematureEndOfStreamError extends DomainError {
  constructor(table: string) {
    super(`Import stream ended before table '${table}' finished.`, 'tenant_transfer.premature_end');
  }
}
