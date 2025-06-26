import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { DB } from 'api/odm';
import relationships from 'api/relationships/relationships';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import entities from './entities';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

interface Relation {
  hub: { toString(): string };
  entity: string;
  template: { toString(): string };
  entityData: {
    template: { toString(): string };
    title: string;
  };
}

const updateMetdataFromTemplateSave = async (
  templateEntities: EntitySchema[],
  language: string,
  template: TemplateSchema,
  reindex = true
) => {
  const entitiesToReindex: string[] = [];
  const entityIds = templateEntities.map(e => e.sharedId).filter((id): id is string => !!id);

  // Batch fetch all relationships at once
  const allRelations = (await relationships.getByDocuments_improved(
    entityIds,
    language
  )) as Relation[];

  // Pre-process relationship properties once
  const relationshipProperties = (template.properties || []).filter(p => p.type === 'relationship');

  if (!relationshipProperties.length) {
    return;
  }

  // Group relations by hub
  const relationsByHub = allRelations.reduce<{ [hubId: string]: Relation[] }>((acc, relation) => {
    const hubId = relation.hub.toString();
    if (!acc[hubId]) {
      acc[hubId] = [];
    }
    acc[hubId].push(relation);
    return acc;
  }, {});

  // Process all entities
  const processEntity = (entity: EntitySchema): EntitySchema | null => {
    if (!entity?.template || !entity.sharedId) {
      return null;
    }

    const metadata = entity.metadata ? { ...entity.metadata } : {};

    // Find all hubs that contain this entity
    const entityHubs = allRelations
      .filter(r => r.entity === entity.sharedId)
      .map(r => r.hub.toString());

    // Get all relations from those hubs
    const relationsForEntity = entityHubs.flatMap(hub => relationsByHub[hub] || []);

    relationshipProperties.forEach(property => {
      const relationshipsGoingToThisProperty = relationsForEntity.filter(
        (r: any) =>
          r.entity !== entity.sharedId && // exclude self-reference
          r.template &&
          r.template.toString() === property.relationType?.toString() &&
          (!property.content || r.entityData.template.toString() === property.content)
      );

      //@ts-ignore
      metadata[property.name] = relationshipsGoingToThisProperty.map((r: any) => ({
        value: r.entity,
        label: r.entityData.title,
      }));
    });

    const updatedEntity = { ...entity, metadata };
    entitiesToReindex.push(updatedEntity.sharedId);
    return entities.sanitize(updatedEntity, template);
  };

  // Batch update entities
  const entitiesToUpdate = templateEntities
    .map(processEntity)
    .filter((e): e is EntitySchema => !!e);

  await Promise.all(
    entitiesToUpdate.map(async entity => entities.updateEntityPerf(entity, template, true))
  );

  if (reindex && entitiesToReindex.length) {
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
    const mongo = getConnection();
    const cursor = mongo.collection('entities').find(query);
    const resultSet = new MongoResultSet(cursor, e => e);
    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      await updateMetdataFromTemplateSave(
        // eslint-disable-next-line no-await-in-loop
        await resultSet.nextBatch(limit),
        language,
        template,
        reindex
      );
    }
  }
};
