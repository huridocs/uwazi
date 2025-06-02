import { ObjectIdSchema } from 'shared/types/commonTypes';
import entitiesModel from 'api/entities/entitiesModel';

interface BatchRange {
  fromId: ObjectIdSchema;
  toId: ObjectIdSchema;
  totalCount: number;
}

const calculateBatches = async (
  template: ObjectIdSchema,
  defaultLanguage?: string,
  batchSize = 500
): Promise<BatchRange[]> => {
  const query = {
    template,
    ...(defaultLanguage && { language: defaultLanguage }),
  };

  const batches: BatchRange[] = [];
  let currentFromId: ObjectIdSchema | null = null;
  let count = 0;
  let lastId: ObjectIdSchema | null = null;

  const entities = await entitiesModel.db.find(query).select('_id').sort({ _id: 1 }).lean();

  entities.forEach((entity: { _id: ObjectIdSchema }) => {
    if (!currentFromId) {
      currentFromId = entity._id;
    }

    count += 1;
    if (count >= batchSize) {
      batches.push({
        fromId: currentFromId,
        toId: entity._id,
        totalCount: count,
      });
      currentFromId = null;
      count = 0;
    }
    lastId = entity._id;
  });

  // Handle remaining entities in last batch
  if (currentFromId && lastId) {
    batches.push({
      fromId: currentFromId,
      toId: lastId,
      totalCount: count,
    });
  }

  return batches;
};

const fetchEntitiesDataForBatch = async (
  template: ObjectIdSchema,
  defaultLanguage: string | undefined,
  fromId: ObjectIdSchema,
  toId: ObjectIdSchema
): Promise<{ sharedId: string; language: string }[]> => {
  const query = {
    template,
    ...(defaultLanguage && { language: defaultLanguage }),
    _id: { $gte: fromId, $lte: toId },
  };

  const entities = await entitiesModel.db
    .find(query)
    .select(['sharedId', 'language'])
    .sort({ _id: 1 })
    .lean();

  return entities.map(e => ({ sharedId: e.sharedId!, language: e.language! }));
};

const fetchEntitiesData = async (
  template: ObjectIdSchema,
  callback: ((batch: { sharedId: string; language: string }[]) => Promise<void>) | undefined,
  defaultLanguage?: string,
  batchSize = 2000
) => {
  console.time('batches');
  const batches = await calculateBatches(template, defaultLanguage, batchSize);
  console.log(JSON.stringify(batches, null, ' '))
  console.timeEnd('batches');
  let allEntities: { sharedId: string; language: string }[] = [];

  if (callback) {
    await batches.reduce(async (promise, batch) => {
      await promise;
      console.time('batch data');
      const batchData = await fetchEntitiesDataForBatch(
        template,
        defaultLanguage,
        batch.fromId,
        batch.toId
      );
      console.timeEnd('batch data');
      console.time('batch callback');
      await callback(batchData);
      console.timeEnd('batch callback');
    }, Promise.resolve());
    return [];
  }

  await batches.reduce(async (promise, batch) => {
    await promise;
    const batchData = await fetchEntitiesDataForBatch(
      template,
      defaultLanguage,
      batch.fromId,
      batch.toId
    );
    allEntities = allEntities.concat(batchData);
  }, Promise.resolve());

  return allEntities;
};

export type { BatchRange };
export { calculateBatches, fetchEntitiesData, fetchEntitiesDataForBatch };
