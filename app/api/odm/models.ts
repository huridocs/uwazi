import { EntitySchema } from 'shared/types/entityType';

export async function QueryForEach(
  query: any,
  batchSize: number,
  fn: (e: EntitySchema) => Promise<void>
) {
  const totalNumber = await query.countDocuments();
  let offset = 0;
  while (offset < totalNumber) {
    // eslint-disable-next-line no-await-in-loop
    const batch = await query
      .sort('id')
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
