import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The export stream was produced by a different Postgres schema than this database has. */
export class SchemaVersionMismatchError extends DomainError {
  constructor(exported: number, current: number) {
    super(
      `Schema version mismatch: the export stream is from schema version ${exported}, ` +
        `but this database is at ${current}. Run migrations to match the export before importing.`,
      'tenant_backup.schema_version_mismatch'
    );
  }
}
