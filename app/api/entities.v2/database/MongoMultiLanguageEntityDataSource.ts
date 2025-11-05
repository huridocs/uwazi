import {
  MongoDataSource,
  MongoDSOptions,
} from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { search } from 'api/search';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { Db, Filter, ObjectId } from 'mongodb';
import { MongoEntityMapper } from 'api/core/infrastructure/mongodb/entity/MongoEntityMapper';
import { Property } from 'api/core/domain/template/Property';
import { MultiLanguageEntityDataSource } from '../contracts/MultiLanguageEntitiesDataSource';
import { Entity } from '../../core/domain/entity/Entity';
import { EntityDBO, EntityTemplateAggregation } from './schemas/EntityTypes';

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

  async bulkUpdate(entitiesToSave: Entity[], properties: Property[] = []) {
    await this.getCollection().bulkWrite(
      entitiesToSave
        .map(entity =>
          entity.translationsList.map(([language, translation]) => {
            const $set = properties.reduce<{ [k: string]: any }>((setOperation, property) => {
              const { value } = translation.getValue(property.name);
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
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<MongoResultSet<EntityTemplateAggregation, Entity>> {
    const relatedEntitiesSharedIds = entities
      .map(e => properties.map(prop => e.getValue(prop.name, e.languages[0]).value).flat())
      .flat()
      .map(metadataValue => metadataValue.value)
      .filter((v): v is string => typeof v === 'string');

    return this.getEntitiesBySharedIds(relatedEntitiesSharedIds);
  }

  private async getByQuery(query: Filter<EntityDBO>) {
    const aggregation = [
      { $match: query },
      {
        $lookup: {
          from: 'templates',
          localField: 'template',
          foreignField: '_id',
          as: 'templateData',
        },
      },
      { $unwind: '$templateData' },
      {
        $group: {
          _id: '$sharedId',
          template: { $first: '$templateData' },
          entities: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          template: 1,
          entities: 1,
        },
      },
    ];

    const cursor = this.getCollection().aggregate<EntityTemplateAggregation>(aggregation);

    return new MongoResultSet<EntityTemplateAggregation, Entity>(cursor, ({ template, entities }) =>
      MongoEntityMapper.toDomain(entities, template)
    );
  }

  async create(entity: Entity): Promise<void> {
    const dbos = MongoEntityMapper.toDBO(entity);

    await this.getCollection().bulkWrite(
      dbos.map(dbo => ({ insertOne: { document: dbo } })),
      { ordered: false }
    );

    this.modifiedSharedIds.add(entity.sharedId);
  }
}
