import { ObjectId } from 'mongodb';
import { IXModelType } from '#shared/types/IXModelType.js';
import { IXModel } from '../domain/IXModelsDataSource.js';
import type { IXModelsRow } from './PostgresIXModelsRow.js';

type OptionalColumn = Exclude<keyof IXModelsRow, '_id' | 'extractorId'>;

const OPTIONAL_COLUMNS: OptionalColumn[] = [
  'creationDate',
  'status',
  'findingSuggestions',
  'maxSuggestionsToFind',
  'totalSuggestionsToFind',
  'processRun',
];

/**
 * Translates between an `ix_models` row and the `IXModel` the port returns. The port still speaks
 * ObjectIds, mirroring what the Mongo implementation returns; the row holds hex strings. A NULL
 * column is an absent field, as it is in Mongo.
 */
class PostgresIXModelsMapper {
  static toDomain(row: Partial<IXModelsRow>): IXModel {
    const present = OPTIONAL_COLUMNS.filter(
      column => row[column] !== null && row[column] !== undefined
    );

    return {
      _id: new ObjectId(row._id),
      extractorId: new ObjectId(row.extractorId),
      ...Object.fromEntries(present.map(column => [column, row[column]])),
    } as IXModel;
  }

  /** Only the fields the model carries, so an update touches no other column. */
  static toRow(model: Partial<IXModelType>): Partial<IXModelsRow> {
    const row: Partial<Record<keyof IXModelsRow, unknown>> = {
      _id: model._id?.toString(),
      extractorId: model.extractorId?.toString(),
      creationDate: model.creationDate,
      status: model.status,
      findingSuggestions: model.findingSuggestions,
      maxSuggestionsToFind: model.maxSuggestionsToFind,
      totalSuggestionsToFind: model.totalSuggestionsToFind,
      processRun: model.processRun,
    };

    return Object.fromEntries(
      Object.entries(row).filter(([, value]) => value !== undefined)
    ) as Partial<IXModelsRow>;
  }
}

export { PostgresIXModelsMapper };
