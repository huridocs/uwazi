import templates from 'api/templates';
import { appContext } from 'api/utils/AppContext';
import { EntitySchema } from 'shared/types/entityType';
import { search } from 'superagent';
import entities from './entities';
import { tenants } from 'api/tenants';

const updateMetdataFromRelationships_patched = async (
  entitiesSharedIds: string[],
  language: string,
  reindex = true
) => {
  const entitiesToReindex: string[] = [];
  const _templates = await templates.get();
  await Promise.all(
    entitiesSharedIds.map(async entityId => {
      const entity = await entities.getById(entityId, language);

      if (entity && entity.template) {
        const template = _templates.find(t => t._id.toString() === entity.template.toString());

        entitiesToReindex.push(entity.sharedId);
        await entities.updateEntity(entities.sanitize(entity, template), template, true);
      }
    })
  );

  if (reindex) {
    await search.indexEntities({ sharedId: { $in: entitiesToReindex } });
  }
};

export const bulkUpdateMetadataFromRelationships = async (
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

      await entities.updateMetdataFromRelationships_patched(entitiesSharedIds, language, reindex);
      await process2(offset + limit, totalRows);
    };
    const totalRows = await entities.count(query);
    await process2(0, totalRows);
  }
};
