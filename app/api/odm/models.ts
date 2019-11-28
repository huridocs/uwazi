/** @format */

import { Document, DocumentQuery, Model, Schema } from 'mongoose';
import { DeleteWriteOpResultObject } from 'mongodb';

/** WithId<T> represents objects received from MongoDB, which are guaranteed to have
 *  the _id field populated, even though T always has _id? optional for validation reasons.
 */
export type WithId<T> = Omit<T, '_id'> & {
  _id: Schema.Types.ObjectId;
};

export interface OdmModel<T> {
  db: Model<WithId<T> & Document>;
  save: (data: Readonly<Partial<T>>) => Promise<WithId<T>>;
  saveMultiple: (data: Readonly<Partial<T>>[]) => Promise<WithId<T>[]>;

  getById: (id: any | string | number) => Promise<WithId<T> | null>;
  get: (
    query: any,
    select?: string,
    pagination?: {}
  ) => DocumentQuery<(WithId<T> & Document)[], WithId<T> & Document>;

  count: (condition: any) => Promise<number>;
  delete: (condition: any) => Promise<DeleteWriteOpResultObject['result']>;
}

export async function QueryForEach<T>(
  query: DocumentQuery<(WithId<T> & Document)[], WithId<T> & Document>,
  batchSize: number,
  fn: (e: WithId<T>) => Promise<void>
) {
  const totalNumber = await query.count();
  let offset = 0;
  while (offset < totalNumber) {
    // eslint-disable-next-line no-await-in-loop
    const batch = await query
      .find()
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
