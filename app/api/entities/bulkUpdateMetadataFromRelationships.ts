import { EntitySchema } from 'shared/types/entityType';
import entities from './entities';
import { tenants } from 'api/tenants';

export const bulkDenormalizeEntities = async (
  query: {},
  language: string,
  limit = 200,
  reindex = true
) => {
  const process = async (offset: number, totalRows: number) => {
    if (offset >= totalRows) {
      return;
    }

    const entitiesSharedIds = (await entities.get(query, 'sharedId', { skip: offset, limit })).map(
      (entity: EntitySchema) => entity.sharedId
    );

    await entities.updateMetdataFromRelationships(entitiesSharedIds, language, reindex);
    await process(offset + limit, totalRows);
  };
  if (!tenants.current().featureFlags?.templatesDenormalizationPerfImprovements) {
    const totalRows = await entities.count(query);
    await process(0, totalRows);
  } else {
    const process2 = async (offset: number, totalRows: number) => {
      if (offset >= totalRows) {
        return;
      }

      const entitiesSharedIds = (
        await entities.get(query, 'sharedId', { skip: offset, limit })
      ).map((entity: EntitySchema) => entity.sharedId);

      await entities.updateMetdataFromRelationships(entitiesSharedIds, language, reindex);
      await process(offset + limit, totalRows);
    };
    const totalRows = await entities.count(query);
    await process2(0, totalRows);
  }
};
