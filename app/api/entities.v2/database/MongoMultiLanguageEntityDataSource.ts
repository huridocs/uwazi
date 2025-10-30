import {
  MongoDataSource,
  MongoDSOptions,
} from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { search } from 'api/search';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { TemplateProperty } from 'api/core/domain/template/Template';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { Db, Filter, ObjectId } from 'mongodb';
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

  private templateDS: TemplatesDataSource;

  private modifiedSharedIds = new Set<string>();

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    templatesDS: TemplatesDataSource,
    options: MongoDSOptions = {}
  ) {
    super(db, transactionManager, options);
    this.templateDS = templatesDS;
    transactionManager.onCommitted(async () => {
      await search.indexEntities({ sharedId: { $in: Array.from(this.modifiedSharedIds) } });
    });
  }

  async deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void> {
    await this.getCollection().updateMany(
      { sharedId: { $in: sharedIds } },
      {
        $unset: Object.fromEntries(propertyNames.map(name => [`metadata.${name}`, ''])),
      }
    );
    sharedIds.forEach(id => this.modifiedSharedIds.add(id));
  }

  async renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void> {
    await this.getCollection().updateMany(
      { sharedId: { $in: sharedIds } },
      {
        $rename: Object.fromEntries(
          Object.entries(propertyNames).map(([oldName, newName]) => [
            `metadata.${oldName}`,
            `metadata.${newName}`,
          ])
        ),
      }
    );
    sharedIds.forEach(id => this.modifiedSharedIds.add(id));
  }

  async bulkUpdate(entitiesToSave: MultiLanguageEntity[], properties: TemplateProperty[] = []) {
    await this.getCollection().bulkWrite(
      entitiesToSave
        .map(entity =>
          entity.getLanguages().map(language => {
            const $set = properties.reduce<{ [k: string]: any }>((setOperation, property) => {
              const value = entity.getValue(property, language);
              if (value) {
                return { ...setOperation, [`metadata.${property.name}`]: value };
              }
              return setOperation;
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
    entitiesToSave.map(e => e.sharedId).forEach(id => this.modifiedSharedIds.add(id));
  }

  async countByTemplateId(templateId: string): Promise<number> {
    const aggregation = [
      { $match: { template: new ObjectId(templateId) } },
      { $group: { _id: '$sharedId' } },
      { $count: 'count' },
    ];

    const result = await this.getCollection().aggregate(aggregation).toArray();
    return result.length ? result[0].count : 0;
  }

  async getSharedIdsByTemplateId(templateId: string) {
    const aggregation = [
      { $match: { template: new ObjectId(templateId) } },
      { $group: { _id: '$sharedId' } },
      { $project: { _id: 0, sharedId: '$_id' } },
    ];

    const cursor = this.getCollection().aggregate(aggregation);
    return new MongoResultSet(cursor, e => e.sharedId);
  }

  async getEntitiesByTemplateId(templateId: string) {
    return this.getByQuery({ template: new ObjectId(templateId) });
  }

  async getEntitiesBySharedIds(sharedIds: string[]) {
    return this.getByQuery({ sharedId: { $in: sharedIds } });
  }

  async getEntitiesByRelatedProperties(
    entities: MultiLanguageEntity[],
    properties: V1RelationshipProperty[]
  ): Promise<MongoResultSet<MultiLanguageEntityDBO, MultiLanguageEntity>> {
    const relatedEntitiesSharedIds = entities
      .map(e => properties.map(prop => e.getValue(prop, e.getLanguages()[0])).flat())
      .flat()
      .map(metadataValue => metadataValue.value)
      .filter((v): v is string => typeof v === 'string');

    return this.getEntitiesBySharedIds(relatedEntitiesSharedIds);
  }

  private async getByQuery(query: Filter<EntityDBO>) {
    const templates = await this.templateDS.getAll().indexed(t => t.id);
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
      entity.withTemplate(templates[e.template]);
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
