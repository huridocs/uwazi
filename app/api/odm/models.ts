import { Query } from 'mongoose';
import { OdmModel, DataType } from './model';

export async function QueryForEach<T>(
  query: Query<DataType<T>[], DataType<T>, {}, DataType<T>>,
  batchSize: number,
  fn: (e: DataType<T>) => Promise<void>
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
