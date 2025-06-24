import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { DB } from 'api/odm';
import relationships from 'api/relationships/relationships';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import entities from './entities';

const updateMetdataFromTemplateSave = async (
  entityIds: string[],
  language: string,
  template: TemplateSchema,
  reindex = true
) => {
  const entitiesToReindex: string[] = [];
  await Promise.all(
    entityIds.map(async entityId => {
      const entity = await entities.getById(entityId, language);
      const relations = await relationships.getByDocument(entityId, language);

      if (entity && entity.template) {
        entity.metadata = entity.metadata || {};
        // const template = _templates.find(t => t._id.toString() === entity.template.toString());

        const relationshipProperties = (template.properties || []).filter(
          p => p.type === 'relationship'
        );
        relationshipProperties.forEach(property => {
          const relationshipsGoingToThisProperty = relations.filter(
            (r: any) =>
              r.template &&
              r.template.toString() === property.relationType?.toString() &&
              (!property.content || r.entityData.template.toString() === property.content)
          );

          //@ts-ignore
          entity.metadata[property.name] = relationshipsGoingToThisProperty.map(r => ({
            value: r.entity,
            label: r.entityData.title,
          }));
        });
        if (relationshipProperties.length && entity.sharedId) {
          entitiesToReindex.push(entity.sharedId);
          await entities.updateEntity(entities.sanitize(entity, template), template, true);
        }
      }
    })
  );

  if (reindex) {
    await search.indexEntities({ sharedId: { $in: entitiesToReindex } });
  }
};

export const bulkDenormalizeEntitiesFromTemplateSave = async (
  template: TemplateSchema,
  language: string,
  limit = 200,
  reindex = true
) => {
  const query = { template: template._id, language };
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

      await updateMetdataFromTemplateSave(entitiesSharedIds, language, template, reindex);
      await process2(offset + limit, totalRows);
    };
    const totalRows = await entities.count(query);
    await process2(0, totalRows);

    const mongo = DB.mongodb_Db(tenants.current().name);
    const cursor = mongo.collection('entities').find(query);
    const resultSet = new MongoResultSet(cursor, e => e);
    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      console.log(await resultSet.nextBatch(limit));
    }
  }
};
