import { ObjectId } from 'mongodb';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';

/** Columns holding ids, stored as hex strings and returned as ObjectIds, as Mongo stores them. */
const ID_COLUMNS = new Set(['_id', 'extractorId', 'fileId', 'entityLanguageId']);

/**
 * Translates an `ix_suggestions` row into the `Suggestion` the port returns. Works on projected
 * rows too, returning only the fields the row carries. A NULL column is an absent field.
 */
class PostgresIXSuggestionsMapper {
  static toDomain(row: Partial<IXSuggestionsRow>): Suggestion {
    return Object.fromEntries(
      Object.entries(row)
        .filter(
          ([column, value]) => column !== 'tenant_id' && value !== null && value !== undefined
        )
        .map(([column, value]) => [
          column,
          ID_COLUMNS.has(column) ? new ObjectId(value as string) : value,
        ])
    ) as unknown as Suggestion;
  }
}

export { PostgresIXSuggestionsMapper };
