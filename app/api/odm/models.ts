import { EntitySchema } from 'shared/types/entityType';
import entities from 'api/entities';

export async function QueryForEach(batchSize: number, fn: (e: EntitySchema) => Promise<void>) {
  const totalNumber = await entities.count({ language: 'en' });
  let offset = 0;
  while (offset < totalNumber) {
    // eslint-disable-next-line no-await-in-loop
    const batch = await entities.getWithoutDocuments(
      { language: 'en' },
      {},
      { sort: 'id', skip: offset, limit: batchSize }
    );

    if (!batch || !batch.length) {
      break;
    }
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(batch.map(fn));
    offset += batch.length;
  }
}
