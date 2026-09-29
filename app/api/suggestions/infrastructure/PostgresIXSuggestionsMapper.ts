import { ObjectId } from 'mongodb';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';

/** Columns holding ids, stored as hex strings and returned as ObjectIds, as Mongo stores them. */
const ID_COLUMNS = new Set(['_id', 'extractorId', 'fileId', 'entityLanguageId']);

type SuggestionColumn = Exclude<keyof IXSuggestionsRow, '_id'>;

/** Every column but `_id`, with the type a bound value is cast to when the binding is untyped. */
const IX_SUGGESTIONS_COLUMN_TYPES: Record<
  SuggestionColumn,
  'text' | 'jsonb' | 'bigint' | 'boolean'
> = {
  extractorId: 'text',
  entityId: 'text',
  entityLanguageId: 'text',
  entityTemplate: 'text',
  entityTitle: 'text',
  fileId: 'text',
  propertyName: 'text',
  language: 'text',
  suggestedValue: 'jsonb',
  suggestedText: 'text',
  currentValue: 'jsonb',
  segment: 'text',
  selectionRectangles: 'jsonb',
  status: 'text',
  error: 'text',
  date: 'bigint',
  state: 'jsonb',
  modelData: 'jsonb',
  useForTraining: 'boolean',
  trainingSample: 'boolean',
};

const COLUMNS = ['_id', ...Object.keys(IX_SUGGESTIONS_COLUMN_TYPES)];

const toColumnValue = (column: string, value: unknown) => {
  if (value === null) {
    return null;
  }
  if (ID_COLUMNS.has(column)) {
    return String(value);
  }
  if (IX_SUGGESTIONS_COLUMN_TYPES[column as SuggestionColumn] === 'jsonb') {
    // Mongo stores a nested undefined as null; JSON.stringify would drop the key instead.
    return JSON.stringify(value, (_key, nested) => (nested === undefined ? null : nested));
  }
  return value;
};

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

  /**
   * Only the fields the suggestion carries, so an update touches no other column, and only those
   * with a column: `page` and `labeledValue` are dropped. JSONB values become JSON text, since they
   * are often plain strings, which a JSONB column rejects when bound as they are.
   */
  static toRow(suggestion: Partial<IXSuggestionType>): Partial<IXSuggestionsRow> {
    const fields = suggestion as Record<string, unknown>;
    return Object.fromEntries(
      COLUMNS.filter(column => fields[column] !== undefined).map(column => [
        column,
        toColumnValue(column, fields[column]),
      ])
    ) as Partial<IXSuggestionsRow>;
  }
}

export type { SuggestionColumn };
export { IX_SUGGESTIONS_COLUMN_TYPES, PostgresIXSuggestionsMapper };
