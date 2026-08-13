import { LanguageISO6391, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { EntityFilters } from '#api/core/application/contracts/EntitiesDAO.js';
import { EntitySchema } from '#shared/types/entityType.js';

type BatchRange = {
  fromId: string;
  toId: string;
  totalCount: number;
};

const entitiesDao = () => EntitiesDAOFactory.default().unrestricted();

const calculateBatches = async (
  template: ObjectIdSchema,
  defaultLanguage?: string,
  batchSize = 500
): Promise<BatchRange[]> => {
  const filters: EntityFilters = { template: template.toString() };
  if (defaultLanguage) {
    filters.language = defaultLanguage;
  }

  const batches: BatchRange[] = [];
  let currentFromId: string | null = null;
  let count = 0;
  let lastId: string | null = null;

  const entities = await entitiesDao().find(filters, {
    select: ['_id'],
    sort: [{ field: '_id', direction: 'asc' }],
  });

  entities.forEach(entity => {
    const entityId = entity._id.toString();
    if (!currentFromId) {
      currentFromId = entityId;
    }

    count += 1;
    if (count >= batchSize) {
      batches.push({
        fromId: currentFromId,
        toId: entityId,
        totalCount: count,
      });
      currentFromId = null;
      count = 0;
    }
    lastId = entityId;
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
) => {
  const entities = await entitiesDao().findByTemplateIdRange(
    {
      templateId: template.toString(),
      from: fromId.toString(),
      to: toId.toString(),
      ...(defaultLanguage && { language: defaultLanguage }),
    },
    {
      select: ['sharedId', 'title', 'language', 'metadata', 'template'],
      sort: [{ field: '_id', direction: 'asc' }],
    }
  );

  return entities as Required<
    Pick<EntitySchema, '_id' | 'sharedId' | 'language' | 'metadata' | 'title' | 'template'>
  >[];
};

const getDefaultEntity = async (sharedId: string, defaultLanguage: LanguageISO6391) => {
  const [defaultEntity] = await entitiesDao().find(
    { sharedId, language: defaultLanguage },
    { select: ['sharedId', 'title', 'language', 'metadata'] }
  );

  if (!defaultEntity) {
    throw new Error(
      `Default Entity not found: {sharedId: ${sharedId}, language: ${defaultLanguage}}`
    );
  }

  return defaultEntity as Required<
    Pick<EntitySchema, '_id' | 'sharedId' | 'language' | 'metadata' | 'title'>
  >;
};

export type { BatchRange };
export { calculateBatches, fetchEntitiesDataForBatch, getDefaultEntity };
