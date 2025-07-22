import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { Filter, ObjectId } from 'mongodb';
import { IndexTypes } from 'shared/data_utils/objectIndex';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MultiLanguageEntityDataSource } from '../contracts/MultiLanguageEntitiesDataSource';
import { MultiLanguageEntity } from '../model/MultiLanguageEntity';
import { EntityMappers } from './EntityMapper';
import { EntityDBO, MultiLanguageEntityDBO } from './schemas/EntityTypes';

export class MongoMultiLanguageEntityDataSource
  extends MongoDataSource<EntityDBO>
  implements MultiLanguageEntityDataSource
{
  protected collectionName = 'entities';

  async bulkUpdate(
    entitiesToSave: MultiLanguageEntity[],
    properties: V1RelationshipProperty[] = []
  ) {
    await this.getCollection().bulkWrite(
      entitiesToSave
        .map(entity =>
          entity.getLanguages().map(language => {
            const $set = properties.reduce<{ [k: string]: any }>((propertyName, property) => {
              const value = entity.getValue(property, language);
              if (value) {
                // eslint-disable-next-line no-param-reassign
                propertyName[`metadata.${property.name}`] = value;
              }
              return propertyName;
            }, {});
            return {
              updateOne: {
                filter: { sharedId: entity.sharedId, language },
                update: { $set },
              },
            };
          })
        )
        .flat(),
      { ordered: false }
    );
  }

  getEntitiesByTemplateId(templateId: string, templates?: Record<IndexTypes, Template>) {
    return this.getByQuery({ template: new ObjectId(templateId) }, templates);
  }

  getEntitiesBySharedIds(sharedIds: string[], templates?: Record<IndexTypes, Template>) {
    return this.getByQuery({ sharedId: { $in: sharedIds } }, templates);
  }

  getEntitiesByRelatedProperties(
    entities: MultiLanguageEntity[],
    properties: V1RelationshipProperty[],
    templates: Record<IndexTypes, Template>
  ): MongoResultSet<MultiLanguageEntityDBO, MultiLanguageEntity> {
    const relatedEntitiesSharedIds = entities
      .map(e => properties.map(prop => e.getValue(prop, e.getLanguages()[0])).flat())
      .flat()
      .map(metadataValue => metadataValue.value)
      .filter((v): v is string => typeof v === 'string');

    return this.getEntitiesBySharedIds(relatedEntitiesSharedIds, templates);
  }

  private getByQuery(query: Filter<EntityDBO>, templates?: Record<IndexTypes, Template>) {
    const aggregation = [
      { $match: query },
      {
        $group: {
          _id: '$sharedId',
          translations: { $push: { k: '$language', v: '$$ROOT' } },
          template: { $first: '$template' },
        },
      },
      {
        $project: {
          _id: 0,
          sharedId: '$_id',
          translations: { $arrayToObject: '$translations' },
          template: 1,
        },
      },
    ];
    const cursor = this.getCollection().aggregate<MultiLanguageEntityDBO>(aggregation);
    return new MongoResultSet<MultiLanguageEntityDBO, MultiLanguageEntity>(cursor, e => {
      const entity = new MultiLanguageEntity(e.sharedId, e.template);
      if (templates) {
        entity.withTemplate(templates[e.template]);
      }
      Object.keys(e.translations).forEach(language => {
        entity.addTranslation(
          language as LanguageISO6391,
          EntityMappers.toModel(e.translations[language])
        );
      });
      return entity;
    });
  }
}
