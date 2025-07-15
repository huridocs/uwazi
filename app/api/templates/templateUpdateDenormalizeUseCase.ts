import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import entities, { model } from 'api/entities';
import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { denormalizeMetadatatImproved } from 'api/entities/denormalize_improved_templates_save';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { applicationEventsBus } from 'api/eventsbus';
import relationships from 'api/relationships/relationships';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { cloneDeep } from 'lodash';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';

export type FullEntity = {
  sharedId: string;
  translations: {
    [language: string]: EntitySchema;
  };
};

class MongoFullEntitiesDataSource extends MongoDataSource<EntityDBO> {
  protected collectionName = 'entities';

  async bulkUpdate(entitiesToSave: FullEntity[], propertyNamesThatChanged: string[] = []) {
    await this.getCollection().bulkWrite(
      // @ts-ignore
      entitiesToSave
        .map(fullEntity => {
          return Object.values(fullEntity.translations).map(e => {
            const $set = propertyNamesThatChanged.reduce<{ [k: string]: any }>((memo, name) => {
              if (e?.metadata?.[name]) {
                // eslint-disable-next-line no-param-reassign
                memo[`metadata.${name}`] = e.metadata[name];
              }
              return memo;
            }, {});
            return {
              updateOne: {
                filter: { _id: e._id },
                update: { $set },
              },
            };
          });
        })
        .flat(),
      { ordered: false }
    );
  }
}

interface Relation {
  hub: { toString(): string };
  entity: string;
  template: { toString(): string };
  entityData: {
    template: { toString(): string };
    title: string;
  };
}

const createMetadataBasedOnRelationships = (
  fullEntity: FullEntity,
  allRelations: Relation[],
  relationsByHub: { [hubId: string]: Relation[] },
  relPropertiesThatChanged: V1RelationshipProperty[]
): FullEntity => {
  Object.keys(fullEntity.translations).forEach(entityLanguage => {
    const entity = fullEntity.translations[entityLanguage];
    const metadata = entity.metadata ? { ...entity.metadata } : {};

    const entityHubs = allRelations
      .filter(r => r.entity === entity.sharedId)
      .map(r => r.hub.toString());

    const relationsForEntity = entityHubs.flatMap(hub => relationsByHub[hub] || []);

    relPropertiesThatChanged.forEach(property => {
      const relationshipsGoingToThisProperty = relationsForEntity.filter(
        r =>
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
    Object.assign(fullEntity.translations[entityLanguage], { metadata });
  });
  return fullEntity;
};
async function getRelationships(templateEntities: FullEntity[], language: string) {
  const allRelations = (await relationships.getByDocuments_improved(
    templateEntities.map(e => e.sharedId),
    language
  )) as Relation[];

  // Group relations by hub
  const relationsByHub = allRelations.reduce<{ [hubId: string]: Relation[] }>((acc, relation) => {
    const hubId = relation.hub.toString();
    if (!acc[hubId]) {
      acc[hubId] = [];
    }
    acc[hubId].push(relation);
    return acc;
  }, {});
  return { allRelations, relationsByHub };
}

async function getRelatedEntities(
  entitiesToUpdate: FullEntity[],
  relPropertiesThatChanged: V1RelationshipProperty[]
) {
  const relatedEntitiesSharedIds = entitiesToUpdate
    // @ts-ignore
    .map(e => relPropertiesThatChanged.map(prop => e.translations.en.metadata[prop.name]).flat())
    .flat()
    .map(metadataValue => metadataValue?.value);

  const relatedEntitiesBySharedId: { [k: string]: EntitySchema } = {};
  const related = await model.getUnrestricted({
    sharedId: { $in: relatedEntitiesSharedIds },
  });

  related.forEach(partner => {
    relatedEntitiesBySharedId[partner.sharedId! + partner.language!] = partner;
  });
  return relatedEntitiesBySharedId;
}

const sanitizeFullEntity = (entity: FullEntity, template: TemplateSchema) => {
  Object.values(entity.translations).forEach(e => {
    entities.sanitize(e, template);
  });
  return entity;
};

const updateMetdataFromTemplateSave = async (
  _templateEntities: FullEntity[],
  language: string,
  template: TemplateSchema,
  relPropertiesThatChanged: V1RelationshipProperty[],
  preloadedData: {
    allTemplates: TemplateSchema[];
  }
) => {
  const { allRelations, relationsByHub } = await getRelationships(_templateEntities, language);

  const entitiesToUpdate = _templateEntities.map(e =>
    sanitizeFullEntity(
      createMetadataBasedOnRelationships(
        cloneDeep(e),
        allRelations,
        relationsByHub,
        relPropertiesThatChanged
      ),
      template
    )
  );

  const relatedEntitiesBySharedId = await getRelatedEntities(
    entitiesToUpdate,
    relPropertiesThatChanged
  );

  const denormalizedEntities = entitiesToUpdate.map(entity =>
    denormalizeMetadatatImproved(entity, template, {
      ...preloadedData,
      relatedEntities: relatedEntitiesBySharedId,
    })
  );

  await _templateEntities.reduce(async (previousPromise, entity, i) => {
    await previousPromise;

    const beforeTranslations = Object.values(entity.translations);
    const afterTranslations = Object.values(entitiesToUpdate[i].translations);

    return applicationEventsBus.emit(
      new EntityUpdatedEvent({
        before: beforeTranslations,
        after: afterTranslations,
        targetLanguageKey: language,
      })
    );
  }, Promise.resolve());

  const db = new MongoFullEntitiesDataSource(getConnection(), DefaultTransactionManager());

  await db.bulkUpdate(
    denormalizedEntities,
    relPropertiesThatChanged.map(r => r.name)
  );
};

export const denormalizeTemplateEntities = async (
  template: TemplateSchema,
  language: string,
  relPropertiesThatChanged: V1RelationshipProperty[],
  preloadedData: {
    allTemplates: TemplateSchema[];
  },
  limit = 200
) => {
  const aggregation = [
    {
      $match: {
        template: template._id,
      },
    },
    {
      $group: {
        _id: '$sharedId',
        translations: {
          $push: {
            k: '$language',
            v: '$$ROOT',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        sharedId: '$_id',
        translations: {
          $arrayToObject: '$translations',
        },
      },
    },
  ];
  const mongo = getConnection();
  const cursor = mongo.collection('entities').aggregate<FullEntity>(aggregation);
  // const cursor = mongo.collection('entities').find({ template: template._id, language });
  const resultSet = new MongoResultSet(cursor, e => e);
  // eslint-disable-next-line no-await-in-loop
  while (await resultSet.hasNext()) {
    // eslint-disable-next-line no-await-in-loop
    await updateMetdataFromTemplateSave(
      // eslint-disable-next-line no-await-in-loop
      await resultSet.nextBatch(limit),
      language,
      template,
      relPropertiesThatChanged,
      preloadedData
    );
  }
};
