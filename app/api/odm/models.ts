import { EntitySchema } from 'shared/types/entityType';
import entities from 'api/entities';

export async function QueryForEach(batchSize: number, fn: (e: EntitySchema) => Promise<void>) {
  let lastId;
  let batch;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    batch = await entities.getWithoutDocuments(
      { language: 'en', ...(lastId ? { _id: { $gt: lastId } } : {}) },
      {},
      { sort: '_id', limit: batchSize }
    );

    if (!batch || !batch.length) {
      break;
    }
    lastId = batch[batch.length - 1]._id;

    // eslint-disable-next-line no-await-in-loop
    await Promise.all(batch.map(fn));
  }
}
