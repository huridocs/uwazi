import { NotFoundError } from '#api/core/domain/error/NotFoundError.js';

export class BlankStateTablesMissingError extends NotFoundError {
  constructor(missingTables: string[]) {
    const tables = [...missingTables].sort().join(', ');
    super(
      `PostgreSQL blank-state tables do not exist: ${tables}. Run the schema migrations first.`,
      'blank_state.tables_missing'
    );
  }
}
