import { search } from 'api/search';
import templates from 'api/templates/templates';
import { tenants } from 'api/tenants';
import { EntitySchema } from 'shared/types/entityType';
import entities from './entities';

const improvedUpdateMetdataFromRelationships = async (
  entitiesSharedIds: string[],
  language: string,
  reindex = true
) => {
  const entitiesToReindex: string[] = [];
  const _templates = await templates.get();
  await Promise.all(
    entitiesSharedIds.map(async entityId => {
      const entity = await entities.getById(entityId, language);

      if (entity && entity.template && entity.sharedId) {
        const template = _templates.find(t => t._id.toString() === entity.template?.toString());

        entitiesToReindex.push(entity.sharedId);
        await entities.updateEntity(entities.sanitize(entity, template), template, true);
      }
    })
  );

  if (reindex) {
    await search.indexEntities({ sharedId: { $in: entitiesToReindex } });
  }
};

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
  if (!tenants.current().featureFlags?.improvedTemplatesSave) {
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

      await improvedUpdateMetdataFromRelationships(entitiesSharedIds, language, reindex);
      await process2(offset + limit, totalRows);
    };
    const totalRows = await entities.count(query);
    await process2(0, totalRows);
  }
};
