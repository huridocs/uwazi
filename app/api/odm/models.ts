import { Document, Schema, FilterQuery, UpdateQuery, QueryOptions, Query } from 'mongoose';
import { OdmModel } from './model';

/** WithId<T> represents objects received from MongoDB, which are guaranteed to have
 *  the _id field populated, even though T always has _id? optional for validation reasons.
 */
export type WithId<T> = T & {
  _id: Schema.Types.ObjectId;
};

export type DataModelType<T> = WithId<T> & Document;

export type UwaziFilterQuery<T> = FilterQuery<DataModelType<T>>;
export type UwaziUpdateQuery<T> = UpdateQuery<DataModelType<T>>;
export type UwaziQueryOptions = QueryOptions;

export async function QueryForEach<T>(
  query: Query<DataModelType<T>[], DataModelType<T>, {}, DataModelType<T>>,
  batchSize: number,
  fn: (e: DataModelType<T>) => Promise<void>
) {
  const totalNumber = await query.countDocuments();
  let offset = 0;
  while (offset < totalNumber) {
    // eslint-disable-next-line no-await-in-loop
    const batch = await query
      .find()
      // potentially slow on large collections !
      .skip(offset)
      .limit(batchSize);
    if (!batch || !batch.length) {
      break;
    }
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(batch.map(fn));
    offset += batch.length;
  }
}

// models are accessed in api/sync, which cannot be type-safe since the document
// type is a request parameter. Thus, we store all OdmModels as type Document.
// eslint-disable-next-line
export let models: { [index: string]: OdmModel<any> } = {};
