import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The import stream names a table that is not tenant data (or not known here). */
export class UnknownTableInManifestError extends DomainError {
  constructor(table: string) {
    super(
      `Manifest references '${table}', which is not a tenant data table.`,
      'tenant_backup.unknown_table'
    );
  }
}
