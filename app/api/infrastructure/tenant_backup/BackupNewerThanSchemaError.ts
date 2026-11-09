import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The backup was exported from a newer schema than this code's migrations reach: no downgrades. */
export class BackupNewerThanSchemaError extends DomainError {
  static readonly category = 'validation' as const;

  constructor(backup: number, latest: number) {
    super(
      `The backup is at schema version ${backup}, newer than the latest migration (${latest}). ` +
        'Migrations only go forward: upgrade it with a release that has those migrations.',
      'tenant_backup.backup_newer_than_schema'
    );
  }
}
