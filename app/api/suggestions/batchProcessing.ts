import { ObjectIdSchema } from 'shared/types/commonTypes';
import entitiesModel from 'api/entities/entitiesModel';

type BatchRange = {
  fromId: string;
  toId: string;
  totalCount: number;
};

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
        fromId: currentFromId.toString(),
        toId: entity._id.toString(),
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
  fromId: ObjectIdSchema,
  toId: ObjectIdSchema,
  defaultLanguage?: string
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

export type { BatchRange };
export { calculateBatches, fetchEntitiesDataForBatch };
