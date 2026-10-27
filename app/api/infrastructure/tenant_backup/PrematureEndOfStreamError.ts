import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The import stream ended before the current table's COPY section was complete. */
export class PrematureEndOfStreamError extends DomainError {
  static readonly category = 'validation' as const;

  constructor(table: string) {
    super(`Import stream ended before table '${table}' finished.`, 'tenant_backup.premature_end');
  }
}
