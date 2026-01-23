import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { search } from '#api/search/index.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { Db, Filter, ObjectId } from 'mongodb';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { Property } from '#api/core/domain/template/Property.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import {
  EntityDBO,
  EntityTemplateAggregation,
} from '#api/entities.v2/database/schemas/EntityTypes.js';

export class MongoMultiLanguageEntityDataSource
  extends MongoDataSource<EntityDBO>
  implements MultiLanguageEntityDataSource
{
  protected collectionName = 'entities';

  private modifiedSharedIds = new Set<string>();

  constructor(db: Db, transactionManager: MongoTransactionManager, options: MongoDSOptions = {}) {
    super(db, transactionManager, options);
    transactionManager.onCommitted(async () => {
      await search.indexEntities({ sharedId: { $in: Array.from(this.modifiedSharedIds) } });
    });
  }

  async bulkUpdate(entities: Entity[]): Promise<void> {
    const updates = entities.flatMap(entity => {
      const dbos = MongoEntityMapper.toDBO(entity);

      return dbos.map(dbo => ({
        replaceOne: {
          filter: { _id: dbo._id },
          replacement: dbo,
        },
      }));
    });

    if (updates.length > 0) {
      await this.getCollection().bulkWrite(updates, { ignoreUndefined: true });
    }

    entities.forEach(entity => this.modifiedSharedIds.add(entity.sharedId));
  }

  private async getReferencePropertyNames(): Promise<string[]> {
    const result = await this.getCollection('templates')
      .aggregate([
        { $unwind: '$properties' },
        {
          $match: {
            'properties.type': { $in: ['select', 'multiselect', 'relationship'] },
          },
        },
        {
          $group: {
            _id: '$properties.name',
          },
        },
      ])
      .toArray();

    return result.map((doc: any) => doc._id);
  }

  private async findTemplatesUsingThesaurus(thesaurusId: string) {
    const directTemplates = await this.getCollection<TemplateDBO>('templates')
      .find({ 'properties.content': thesaurusId })
      .project({ _id: 1 })
      .toArray();

    const relatedTemplates = await this.getCollection<TemplateDBO>('templates')
      .find({
        'properties.type': 'relationship',
        'properties.content': { $in: directTemplates.map(t => t._id.toString()) },
      })
      .project({ _id: 1 })
      .toArray();

    const allTemplates = [...directTemplates, ...relatedTemplates];

    return Array.from(new Set(allTemplates.map(t => t._id)));
  }

  async getSharedIdsUsingThesaurus(thesaurusId: string) {
    const settings = await this.getCollection<SettingsType>('settings').findOne();
    const defaultLanguage = settings?.languages?.find(l => l.default)?.key;

    if (!defaultLanguage) {
      throw new Error('Default language not found in settings when trying to delete references');
    }

    const uniqueTemplateIds = await this.findTemplatesUsingThesaurus(thesaurusId);

    const entities = await this.getCollection()
      .aggregate([
        {
          $match: {
            language: defaultLanguage,
            template: { $in: uniqueTemplateIds },
          },
        },
        {
          $addFields: {
            hasNonEmptyMetadata: {
              $anyElementTrue: {
                $map: {
                  input: { $objectToArray: '$metadata' },
                  as: 'field',
                  in: { $gt: [{ $size: '$$field.v' }, 0] },
                },
              },
            },
          },
        },
        {
          $match: {
            hasNonEmptyMetadata: true,
          },
        },
        {
          $project: {
            sharedId: 1,
          },
        },
      ])
      .toArray();

    return entities.map(e => e.sharedId);
  }

  private async findAffectedSharedIds(
    deletedSharedIds: string[],
    propertyNames: string[]
  ): Promise<string[]> {
    const settings = await this.getCollection<SettingsType>('settings').findOne();
    const defaultLanguage = settings?.languages?.find(l => l.default)?.key;

    if (!defaultLanguage) {
      throw new Error('Default language not found in settings when trying to delete references');
    }

    const orConditions = propertyNames.map(propName => ({
      [`metadata.${propName}.value`]: { $in: deletedSharedIds },
    }));

    return (
      await this.getCollection()
        .find({ language: defaultLanguage, $or: orConditions }, { projection: { sharedId: 1 } })
        .toArray()
    ).map(doc => doc.sharedId);
  }

  private async updateMetadataReferences(
    affectedSharedIds: string[],
    deletedSharedIds: string[]
  ): Promise<void> {
    await this.getCollection().updateMany({ sharedId: { $in: affectedSharedIds } }, [
      {
        $set: {
          metadata: {
            $arrayToObject: {
              $map: {
                input: { $objectToArray: '$metadata' },
                as: 'prop',
                in: {
                  k: '$$prop.k',
                  v: {
                    $filter: {
                      input: '$$prop.v',
                      as: 'item',
                      cond: { $not: { $in: ['$$item.value', deletedSharedIds] } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);
  }

  async deleteReferencesToSharedIds(deletedSharedIds: string[]): Promise<void> {
    if (deletedSharedIds.length === 0) return;

    const propertyNames = await this.getReferencePropertyNames();
    if (propertyNames.length === 0) return;

    const affectedSharedIds = await this.findAffectedSharedIds(deletedSharedIds, propertyNames);
    if (affectedSharedIds.length === 0) return;

    affectedSharedIds.forEach(id => this.modifiedSharedIds.add(id));

    await this.updateMetadataReferences(affectedSharedIds, deletedSharedIds);
  }

  async bulkDelete(sharedIds: string[]): Promise<void> {
    await this.getCollection().deleteMany({ sharedId: { $in: sharedIds } });
  }

  async getAllBySharedId(sharedIds: string[]): Promise<ResultType<Entity[], Error>> {
    const entities = await (await this.getByQuery({ sharedId: { $in: sharedIds } })).all();

    if (!entities.length) {
      return Result.fail(new Error(`Entities with sharedIds ${sharedIds.join(', ')} not found`));
    }

    return Result.ok(entities);
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

  async bulkUpdateDeprecated(entitiesToSave: Entity[], properties: Property[] = []) {
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
    await this.getCollection().insertMany(dbos, { ignoreUndefined: true });
    this.modifiedSharedIds.add(entity.sharedId);
  }

  async bulkInsert(entities: Entity[]): Promise<void> {
    if (entities.length === 0) {
      return;
    }
    const allDbos = entities.flatMap(entity => MongoEntityMapper.toDBO(entity));
    await this.getCollection().insertMany(allDbos, { ignoreUndefined: true, ordered: false });
    entities.forEach(entity => this.modifiedSharedIds.add(entity.sharedId));
  }
}
